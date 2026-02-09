import Bull from 'bull';
import { prisma } from './database';
import { WhatsAppService } from './whatsapp';
import { getSocketService } from './socket';
import { MetricsService } from './metrics';
import logger from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const campaignQueue = new Bull('campaign-processing', redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 100
  }
});

export const messageQueue = new Bull('message-sending', redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 1000,
    removeOnFail: 500
  },
  limiter: {
    max: 10,
    duration: 60000 // 10 messages per minute default
  }
});

interface CampaignJobData {
  campaignId: string;
  userId: string;
}

interface MessageJobData {
  campaignId: string;
  messageId: string;
  userId: string;
  customerId: string;
  customerPhone: string;
  content: string;
  templateId?: string;
  attempt: number;
}

campaignQueue.process(async (job) => {
  const { campaignId, userId } = job.data as CampaignJobData;
  
  logger.info('Processing campaign', { campaignId, userId });

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        schedule: true
      }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status === 'cancelled') {
      logger.info('Campaign was cancelled', { campaignId });
      return;
    }

    // Log campaign start
    await prisma.campaignLog.create({
      data: {
        campaignId,
        eventType: 'started',
        eventData: {
          totalMessages: campaign.totalMessages,
          scheduledAt: campaign.scheduledAt
        }
      }
    });

    // Get campaign messages
    const messages = await prisma.campaignMessage.findMany({
      where: {
        campaignId,
        status: 'pending'
      },
      include: {
        customer: true
      }
    });

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'sending',
        startedAt: new Date()
      }
    });

    // Get throttle settings
    const throttleRate = campaign.schedule?.throttleRate || 10;
    const retryAttempts = campaign.schedule?.retryAttempts || 3;

    // Update limiter based on campaign settings
    messageQueue.limiter = {
      max: throttleRate,
      duration: 60000
    } as any;

    // Queue individual messages
    const messageJobs = messages.map((message, index) => ({
      name: `message-${message.id}`,
      data: {
        campaignId,
        messageId: message.id,
        userId,
        customerId: message.customerId,
        customerPhone: message.customer.phone,
        content: message.content,
        templateId: message.templateId,
        attempt: 0
      } as MessageJobData,
      opts: {
        delay: index * 1000, // Stagger messages by 1 second
        attempts: retryAttempts
      }
    }));

    await messageQueue.addBulk(messageJobs);

    logger.info('Campaign messages queued', { 
      campaignId, 
      messageCount: messages.length,
      throttleRate 
    });

    // Track progress
    job.progress(0);

  } catch (error) {
    logger.error('Campaign processing error', { error, campaignId });
    
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'failed' }
    });

    await prisma.campaignLog.create({
      data: {
        campaignId,
        eventType: 'failed',
        eventData: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    });

    throw error;
  }
});

messageQueue.process(async (job) => {
  const { 
    campaignId, 
    messageId, 
    userId, 
    customerPhone, 
    content, 
    templateId,
    attempt 
  } = job.data as MessageJobData;

  logger.info('Sending message', { messageId, campaignId, attempt });

  try {
    const whatsappService = new WhatsAppService();
    const socketService = getSocketService();

    // Check campaign status
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { schedule: true }
    });

    if (!campaign || campaign.status === 'cancelled') {
      logger.info('Campaign cancelled, skipping message', { campaignId, messageId });
      return;
    }

    // Check business hours window if configured
    if (campaign.schedule?.windowStart && campaign.schedule?.windowEnd) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      
      if (currentTime < campaign.schedule.windowStart || currentTime > campaign.schedule.windowEnd) {
        logger.info('Outside business hours window, delaying message', { 
          messageId, 
          currentTime,
          window: `${campaign.schedule.windowStart}-${campaign.schedule.windowEnd}` 
        });
        
        // Reschedule for next business hours
        throw new Error('Outside business hours window');
      }
    }

    // Send message
    const result = await whatsappService.sendTextMessage(
      userId,
      customerPhone,
      content
    );

    if (result.success) {
      // Update message status
      await prisma.campaignMessage.update({
        where: { id: messageId },
        data: {
          status: 'sent',
          sentAt: new Date(),
          whatsappMessageId: result.messageId
        }
      });

      // Update campaign counts
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          sentMessages: { increment: 1 }
        }
      });

      // Log success
      await prisma.campaignLog.create({
        data: {
          campaignId,
          messageId,
          eventType: 'message_sent',
          eventData: {
            whatsappMessageId: result.messageId,
            attempt: attempt + 1
          }
        }
      });

      // Record metric
      await MetricsService.recordMessageSent('outbound');

      // Emit real-time update
      if (socketService) {
        socketService.emitCampaignUpdate(userId, campaignId, {
          type: 'message_sent',
          messageId,
          status: 'sent'
        });
      }

      logger.info('Message sent successfully', { messageId, campaignId });
    } else {
      throw new Error(result.error || 'Failed to send message');
    }

  } catch (error) {
    logger.error('Message sending error', { error, messageId, campaignId, attempt });

    // Update message status as failed
    await prisma.campaignMessage.update({
      where: { id: messageId },
      data: {
        status: 'failed',
        failedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    // Update campaign counts
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        failedMessages: { increment: 1 }
      }
    });

    // Log failure
    await prisma.campaignLog.create({
      data: {
        campaignId,
        messageId,
        eventType: 'message_failed',
        eventData: {
          error: error instanceof Error ? error.message : 'Unknown error',
          attempt: attempt + 1
        }
      }
    });

    // Emit real-time update
    const socketService = getSocketService();
    if (socketService) {
      socketService.emitCampaignUpdate(userId, campaignId, {
        type: 'message_failed',
        messageId,
        status: 'failed'
      });
    }

    throw error;
  }
});

// Monitor campaign completion
messageQueue.on('completed', async (job) => {
  const { campaignId } = job.data as MessageJobData;
  await checkCampaignCompletion(campaignId);
});

messageQueue.on('failed', async (job, error) => {
  const { campaignId, messageId } = job.data as MessageJobData;
  
  logger.error('Message job failed', { 
    messageId, 
    campaignId, 
    error: error.message,
    attempts: job.attemptsMade
  });

  await checkCampaignCompletion(campaignId);
});

async function checkCampaignCompletion(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: {
            campaignMessages: {
              where: {
                OR: [
                  { status: 'pending' },
                  { status: 'sending' }
                ]
              }
            }
          }
        }
      }
    });

    if (!campaign) return;

    const pendingCount = campaign._count.campaignMessages;

    // Check if all messages are processed
    if (pendingCount === 0 && campaign.status === 'sending') {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      await prisma.campaignLog.create({
        data: {
          campaignId,
          eventType: 'completed',
          eventData: {
            totalMessages: campaign.totalMessages,
            sentMessages: campaign.sentMessages,
            failedMessages: campaign.failedMessages,
            deliveredMessages: campaign.deliveredMessages
          }
        }
      });

      const socketService = getSocketService();
      if (socketService) {
        socketService.emitCampaignUpdate(campaign.userId, campaignId, {
          type: 'completed',
          totalMessages: campaign.totalMessages,
          sentMessages: campaign.sentMessages,
          failedMessages: campaign.failedMessages
        });
      }

      logger.info('Campaign completed', { 
        campaignId,
        sent: campaign.sentMessages,
        failed: campaign.failedMessages
      });
    }
  } catch (error) {
    logger.error('Error checking campaign completion', { error, campaignId });
  }
}

export const startCampaign = async (campaignId: string, userId: string) => {
  await campaignQueue.add('process-campaign', {
    campaignId,
    userId
  });
};

export const cancelCampaign = async (campaignId: string) => {
  // Remove pending jobs for this campaign
  const jobs = await messageQueue.getJobs(['waiting', 'delayed', 'active']);
  
  for (const job of jobs) {
    const data = job.data as MessageJobData;
    if (data.campaignId === campaignId) {
      await job.remove();
    }
  }

  logger.info('Campaign jobs cancelled', { campaignId });
};
