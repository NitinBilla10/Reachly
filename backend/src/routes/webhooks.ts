import { Router, Request, Response } from 'express';
import { prisma } from '../services/database';
import { WhatsAppService } from '../services/whatsapp';
import { getSocketService } from '../services/socket';

const router = Router();

// WhatsApp webhook verification
router.get('/whatsapp', async (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token) {
      const whatsappService = new WhatsAppService();
      const result = await whatsappService.verifyWebhook(token as string, challenge as string);
      
      if (result.success) {
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send('Forbidden');
      }
    }

    res.sendStatus(400);
  } catch (error) {
    res.sendStatus(500);
  }
});

// WhatsApp webhook for messages and status updates
router.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Handle webhook verification challenge
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        // Handle messages
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              if (change.value.messages) {
                await handleIncomingMessage(change.value);
              }
              if (change.value.statuses) {
                await handleMessageStatusUpdate(change.value);
              }
            }
          }
        }
      }
      
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Handle incoming messages from WhatsApp
async function handleIncomingMessage(value: any) {
  try {
    const messages = value.messages;
    const contacts = value.contacts;

    const metadata = value.metadata;

    if (!messages || messages.length === 0) return;

    // Get WhatsApp credentials to find the user
    const credentials = await prisma.whatsAppCredentials.findFirst({
      where: { phoneNumberId: metadata?.phone_number_id }
    });

    if (!credentials) {
      console.log(`Unknown phone number ID: ${metadata?.phone_number_id}`);
      return;
    }

    const userId = credentials.userId;

    for (const message of messages) {
      const from = message.from; // Customer's phone number
      const messageId = message.id;
      const timestamp = new Date(parseInt(message.timestamp) * 1000);

      // Find the customer by phone number (using endsWith to ignore formatting)
      const last10 = from.slice(-10);
      let customer = await prisma.customer.findFirst({
        where: {
          phone: { endsWith: last10 }
        },
        include: {
          user: true
        }
      });

      if (!customer) {
        console.log(`Received message from unknown number: ${from}`);
        continue;
      }

      // Find or create conversation
      let conversation = await prisma.conversation.findUnique({
        where: {
          userId_customerId: {
            userId: customer.userId,
            customerId: customer.id
          }
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            userId: customer.userId,
            customerId: customer.id,
            status: 'active',
            lastMessageAt: timestamp,
            lastCustomerMessageAt: timestamp
          }
        });
      }

      // Extract message content based on type
      let content = '';
      let messageType = 'text';

      if (message.type === 'text') {
        content = message.text.body;
        
        // Opt-in / Opt-out logic
        const lowerContent = content.toLowerCase().trim();
        if (['stop', 'unsubscribe', 'cancel'].includes(lowerContent)) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { optIn: false }
          });
        } else if (['start', 'subscribe'].includes(lowerContent)) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { optIn: true }
          });
        }
      } else if (message.type === 'template') {
        content = `[Template] ${message.template.name}`;
        messageType = 'template';
      } else if (message.type === 'image') {
        content = '[Image received]';
        messageType = 'image';
      } else if (message.type === 'document') {
        content = '[Document received]';
        messageType = 'document';
      } else if (message.type === 'audio') {
        content = '[Audio received]';
        messageType = 'audio';
      }

      // Create message record
      const newMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          customerId: customer.id,
          content,
          messageType,
          direction: 'inbound',
          whatsappMessageId: messageId,
          status: 'received',
          sentAt: timestamp,
          metadata: {
            whatsappMessage: message
          }
        },
        include: {
          conversation: {
            include: {
              customer: true
            }
          }
        }
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: timestamp,
          lastCustomerMessageAt: timestamp,
          updatedAt: new Date()
        }
      });

      // Emit real-time update
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitNewMessage(conversation.id, newMessage);
        socketService.emitConversationUpdate(customer.userId, conversation.id, {
          type: 'new_message',
          message: newMessage
        });
      }

      console.log(`Processed incoming message from ${from}: ${content}`);
    }
  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

// Handle message status updates
async function handleMessageStatusUpdate(value: any) {
  try {
    const statuses = value.statuses;

    if (!statuses || statuses.length === 0) return;

    for (const status of statuses) {
      const messageId = status.id; // WhatsApp message ID
      const statusType = status.status; // sent, delivered, read, failed
      const recipientId = status.recipient_id;
      const timestamp = new Date(parseInt(status.timestamp) * 1000);

      // Find the message by WhatsApp message ID
      const message = await prisma.message.findFirst({
        where: {
          whatsappMessageId: messageId
        },
        include: {
          conversation: true
        }
      });

      if (!message) {
        console.log(`Received status update for unknown message: ${messageId}`);
        continue;
      }

      // Update message status based on webhook type
      let updateData: any = {
        status: mapStatusType(statusType),
        updatedAt: new Date()
      };

      if (statusType === 'delivered') {
        updateData.deliveredAt = timestamp;
      } else if (statusType === 'read') {
        updateData.readAt = timestamp;
      } else if (statusType === 'failed') {
        updateData.failedAt = timestamp;
        updateData.error = status.errors?.[0]?.error_data?.details || 'Message failed';
      }

      // Update the message
      const updatedMessage = await prisma.message.update({
        where: { id: message.id },
        data: updateData
      });

      // Also update campaign message if it exists
      await prisma.campaignMessage.updateMany({
        where: {
          whatsappMessageId: messageId
        },
        data: {
          status: mapStatusType(statusType),
          ...(statusType === 'delivered' && { deliveredAt: timestamp }),
          ...(statusType === 'read' && { readAt: timestamp }),
          ...(statusType === 'failed' && { failedAt: timestamp })
        }
      });

      // Update campaign statistics
      const campaignMessage = await prisma.campaignMessage.findFirst({
        where: {
          whatsappMessageId: messageId
        }
      });

      if (campaignMessage) {
        // Update campaign counts
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignMessage.campaignId }
        });

        if (campaign) {
          let deliveredCount = campaign.deliveredMessages;
          if (statusType === 'delivered') {
            const updatedCampaign = await prisma.campaign.update({
              where: { id: campaign.id },
              data: {
                deliveredMessages: { increment: 1 }
              }
            });
            deliveredCount = updatedCampaign.deliveredMessages;
          }

          // Emit real-time campaign update
          const socketService = getSocketService();
          if (socketService) {
            socketService.emitCampaignUpdate(campaign.userId, campaign.id, {
              type: 'message_status_updated',
              messageId,
              status: statusType,
              deliveredCount
            });
          }
        }
      }

      // Emit real-time message status update
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitMessageStatusUpdate(message.conversationId, message.id, statusType);
      }

      console.log(`Updated message ${messageId} status to ${statusType}`);
    }
  } catch (error) {
    console.error('Error handling message status update:', error);
  }
}

// Helper function to map WhatsApp status types
function mapStatusType(statusType: string): string {
  switch (statusType) {
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'read':
      return 'read';
    case 'failed':
      return 'failed';
    default:
      return 'unknown';
  }
}

export default router;