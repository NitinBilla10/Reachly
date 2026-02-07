import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from './database';
import { WhatsAppService } from './whatsapp';
import { getSocketService } from './socket';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Campaign Queue
export const campaignQueue = new Queue('campaign', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Message Queue
export const messageQueue = new Queue('message', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 500,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Import Queue
export const importQueue = new Queue('import', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 10,
    removeOnFail: 10,
  },
});

// Webhook Queue
export const webhookQueue = new Queue('webhook', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

// Campaign Worker
export const campaignWorker = new Worker(
  'campaign',
  async (job: Job) => {
    const { campaignId, userId } = job.data;
    
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          template: true,
          targetTags: { include: { tag: true } },
        },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get customers with target tags
      const tagIds = campaign.targetTags.map(t => t.tagId);
      let customers;
      
      if (tagIds.length > 0) {
        customers = await prisma.customer.findMany({
          where: {
            userId,
            tags: { some: { tagId: { in: tagIds } } },
            optIn: true,
          },
        });
      } else {
        // If no tags specified, get all opted-in customers
        customers = await prisma.customer.findMany({
          where: {
            userId,
            optIn: true,
          },
        });
      }

      // Update campaign status
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'sending',
          startedAt: new Date(),
          totalMessages: customers.length,
        },
      });

      const whatsappService = new WhatsAppService();

      // Send messages with rate limiting
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        
        try {
          // Check 24-hour window
          const canSendFree = customer.windowExpiresAt && customer.windowExpiresAt > new Date();
          
          if (!canSendFree && campaign.template.status !== 'approved') {
            // Outside 24-hour window and template not approved - skip
            await prisma.campaignMessage.updateMany({
              where: { campaignId, customerId: customer.id },
              data: {
                status: 'failed',
                error: 'Outside 24-hour window and template not approved',
                failedAt: new Date(),
              },
            });
            continue;
          }

          let result;
          
          if (canSendFree) {
            // Can send free text message within 24-hour window
            const messageContent = campaign.template.content;
            result = await whatsappService.sendTextMessage(userId, customer.phone, messageContent);
          } else {
            // Must use template outside 24-hour window
            result = await whatsappService.sendTemplateMessage(
              userId,
              customer.phone,
              campaign.template.whatsappTemplateId || campaign.template.name,
              campaign.template.language
            );
          }

          // Create or update campaign message
          await prisma.campaignMessage.upsert({
            where: {
              campaignId_customerId: {
                campaignId,
                customerId: customer.id,
              },
            },
            update: {
              content: campaign.template.content,
              status: result.success ? 'sent' : 'failed',
              whatsappMessageId: result.messageId,
              error: result.error || null,
              sentAt: result.success ? new Date() : null,
              failedAt: result.success ? null : new Date(),
            },
            create: {
              campaignId,
              customerId: customer.id,
              templateId: campaign.templateId,
              content: campaign.template.content,
              status: result.success ? 'sent' : 'failed',
              whatsappMessageId: result.messageId,
              error: result.error || null,
              sentAt: result.success ? new Date() : null,
              failedAt: result.success ? null : new Date(),
            },
          });

          // Update campaign counters
          await prisma.campaign.update({
            where: { id: campaignId },
            data: {
              sentMessages: { increment: result.success ? 1 : 0 },
              failedMessages: { increment: result.success ? 0 : 1 },
            },
          });

          // Emit progress update
          const socketService = getSocketService();
          if (socketService) {
            socketService.emitCampaignUpdate(userId, campaignId, {
              type: 'progress',
              processed: i + 1,
              total: customers.length,
            });
          }

          // Rate limiting - wait 100ms between messages
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error: any) {
          console.error(`Failed to send message to ${customer.phone}:`, error);
          
          await prisma.campaignMessage.upsert({
            where: {
              campaignId_customerId: {
                campaignId,
                customerId: customer.id,
              },
            },
            update: {
              status: 'failed',
              error: error.message,
              failedAt: new Date(),
            },
            create: {
              campaignId,
              customerId: customer.id,
              templateId: campaign.templateId,
              content: campaign.template.content,
              status: 'failed',
              error: error.message,
              failedAt: new Date(),
            },
          });
        }
      }

      // Mark campaign as completed
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Emit completion update
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitCampaignUpdate(userId, campaignId, {
          type: 'completed',
        });
      }

    } catch (error: any) {
      console.error('Campaign processing error:', error);
      
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  },
  { connection: redisConnection }
);

// Message Worker
export const messageWorker = new Worker(
  'message',
  async (job: Job) => {
    const { userId, customerId, conversationId, content, messageType, templateId, templateVariables } = job.data;
    
    try {
      const whatsappService = new WhatsAppService();
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, userId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      let result;

      if (messageType === 'template' && templateId) {
        const template = await prisma.template.findFirst({
          where: { id: templateId, userId },
        });

        if (!template) {
          throw new Error('Template not found');
        }

        // Check 24-hour window
        const canSendFree = customer.windowExpiresAt && customer.windowExpiresAt > new Date();
        
        if (!canSendFree && template.status !== 'approved') {
          throw new Error('Outside 24-hour window and template not approved');
        }

        if (canSendFree) {
          // Within window - send as text with variables replaced
          let messageContent = template.content;
          if (templateVariables) {
            Object.entries(templateVariables).forEach(([key, value]) => {
              messageContent = messageContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            });
          }
          result = await whatsappService.sendTextMessage(userId, customer.phone, messageContent);
        } else {
          // Outside window - must use approved template
          const parameters = templateVariables 
            ? Object.entries(templateVariables).map(([_, value]) => ({
                type: 'text',
                text: String(value),
              }))
            : [];
          
          result = await whatsappService.sendTemplateMessage(
            userId,
            customer.phone,
            template.whatsappTemplateId || template.name,
            template.language,
            parameters
          );
        }
      } else {
        // Check 24-hour window for free messages
        const canSendFree = customer.windowExpiresAt && customer.windowExpiresAt > new Date();
        
        if (!canSendFree) {
          throw new Error('Cannot send free-form message outside 24-hour window');
        }

        result = await whatsappService.sendTextMessage(userId, customer.phone, content);
      }

      if (result.success) {
        // Update message status
        await prisma.message.updateMany({
          where: {
            conversationId,
            content,
            direction: 'outbound',
          },
          data: {
            whatsappMessageId: result.messageId,
            status: 'sent',
          },
        });

        // Emit update
        const socketService = getSocketService();
        if (socketService) {
          socketService.emitMessageStatusUpdate(conversationId, result.messageId || '', 'sent');
        }
      } else {
        throw new Error(result.error || 'Failed to send message');
      }

    } catch (error: any) {
      console.error('Message sending error:', error);
      
      // Update message status to failed
      await prisma.message.updateMany({
        where: {
          conversationId,
          content,
          direction: 'outbound',
        },
        data: {
          status: 'failed',
          error: error.message,
          failedAt: new Date(),
        },
      });

      throw error;
    }
  },
  { connection: redisConnection }
);

// Webhook Worker
export const webhookWorker = new Worker(
  'webhook',
  async (job: Job) => {
    const { type, payload } = job.data;
    
    try {
      switch (type) {
        case 'message_received':
          await handleIncomingMessage(payload);
          break;
        case 'message_status':
          await handleMessageStatus(payload);
          break;
        case 'message_delivered':
          await handleMessageDelivered(payload);
          break;
        case 'message_read':
          await handleMessageRead(payload);
          break;
        default:
          console.log(`Unknown webhook type: ${type}`);
      }
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  },
  { connection: redisConnection }
);

async function handleIncomingMessage(payload: any) {
  const { userId, from, message } = payload;

  // Find or create customer
  let customer = await prisma.customer.findFirst({
    where: { phone: from, userId },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        phone: from,
        name: from,
        userId,
        optIn: true,
        optInAt: new Date(),
      },
    });
  }

  // Update 24-hour window
  const windowExpiresAt = new Date();
  windowExpiresAt.setHours(windowExpiresAt.getHours() + 24);

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      lastInboundMessageAt: new Date(),
      windowExpiresAt,
    },
  });

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: { userId, customerId: customer.id },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userId,
        customerId: customer.id,
      },
    });
  }

  // Create message
  const newMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      customerId: customer.id,
      userId,
      content: message.text?.body || '',
      messageType: message.type || 'text',
      direction: 'inbound',
      whatsappMessageId: message.id,
      status: 'delivered',
      deliveredAt: new Date(),
    },
  });

  // Update conversation
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
    },
  });

  // Check for quick reply match
  const quickReplies = await prisma.quickReply.findMany({
    where: { userId, isActive: true },
    orderBy: { priority: 'desc' },
  });

  for (const quickReply of quickReplies) {
    let shouldReply = false;
    const content = message.text?.body?.toLowerCase() || '';
    const keyword = quickReply.keyword.toLowerCase();

    switch (quickReply.matchType) {
      case 'exact':
        shouldReply = content === keyword;
        break;
      case 'contains':
        shouldReply = content.includes(keyword);
        break;
      case 'starts_with':
        shouldReply = content.startsWith(keyword);
        break;
    }

    if (shouldReply) {
      // Send quick reply
      await messageQueue.add('send-quick-reply', {
        userId,
        customerId: customer.id,
        conversationId: conversation.id,
        content: quickReply.response,
        quickReplyId: quickReply.id,
      });
      break;
    }
  }

  // Emit to socket
  const socketService = getSocketService();
  if (socketService) {
    socketService.emitNewMessage(conversation.id, newMessage);
  }
}

async function handleMessageStatus(payload: any) {
  const { whatsappMessageId, status, timestamp } = payload;

  // Update message status
  await prisma.message.updateMany({
    where: { whatsappMessageId },
    data: {
      status,
      ...(status === 'delivered' && { deliveredAt: new Date(timestamp * 1000) }),
      ...(status === 'read' && { readAt: new Date(timestamp * 1000) }),
    },
  });

  // Also update campaign message if exists
  await prisma.campaignMessage.updateMany({
    where: { whatsappMessageId },
    data: {
      status,
      ...(status === 'delivered' && { deliveredAt: new Date(timestamp * 1000) }),
      ...(status === 'read' && { readAt: new Date(timestamp * 1000) }),
    },
  });
}

async function handleMessageDelivered(payload: any) {
  await handleMessageStatus({ ...payload, status: 'delivered' });
}

async function handleMessageRead(payload: any) {
  await handleMessageStatus({ ...payload, status: 'read' });
}

export const closeQueueConnections = async () => {
  await campaignQueue.close();
  await messageQueue.close();
  await importQueue.close();
  await webhookQueue.close();
  await redisConnection.quit();
};
