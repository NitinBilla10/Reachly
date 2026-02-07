import { Router, Request, Response } from 'express';
import { prisma } from '../services/database';
import { WhatsAppService } from '../services/whatsapp';
import { webhookQueue } from '../services/queue';
import { getSocketService } from '../services/socket';

const router = Router();

// WhatsApp webhook verification
router.get('/whatsapp', async (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Webhook verification request:', { mode, token, challenge });

    if (mode === 'subscribe' && token && challenge) {
      // Verify the token matches our stored token
      // In production, you might want to validate against the user's specific webhookVerifyToken
      const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
      
      if (token === verifyToken) {
        console.log('Webhook verified successfully');
        return res.status(200).send(challenge);
      }
    }

    console.log('Webhook verification failed');
    res.sendStatus(403);
  } catch (error: any) {
    console.error('Webhook verification error:', error);
    res.sendStatus(500);
  }
});

// WhatsApp webhook events
router.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));

    const body = req.body;

    // Send immediate response to WhatsApp
    res.sendStatus(200);

    // Process the webhook asynchronously
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Handle messages
          if (value.messages) {
            for (const message of value.messages) {
              await handleIncomingMessage(value, message);
            }
          }

          // Handle message status updates
          if (value.statuses) {
            for (const status of value.statuses) {
              await handleMessageStatus(status);
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    // Already sent 200, just log the error
  }
});

async function handleIncomingMessage(value: any, message: any) {
  try {
    const phoneNumberId = value.metadata?.phone_number_id;
    const from = message.from;
    const messageId = message.id;
    const timestamp = message.timestamp;

    // Find user by phone number ID
    const credentials = await prisma.whatsAppCredentials.findFirst({
      where: { phoneNumberId }
    });

    if (!credentials) {
      console.log(`No user found for phone number ID: ${phoneNumberId}`);
      return;
    }

    const userId = credentials.userId;

    // Queue the webhook for processing
    await webhookQueue.add('process-webhook', {
      type: 'message_received',
      payload: {
        userId,
        from,
        message: {
          id: messageId,
          type: message.type,
          timestamp,
          text: message.text,
          image: message.image,
          video: message.video,
          audio: message.audio,
          document: message.document,
          location: message.location,
          contacts: message.contacts,
        }
      }
    });

  } catch (error: any) {
    console.error('Error handling incoming message:', error);
  }
}

async function handleMessageStatus(status: any) {
  try {
    const messageId = status.id;
    const statusValue = status.status; // sent, delivered, read, failed
    const timestamp = status.timestamp;

    // Update message status in database
    await prisma.message.updateMany({
      where: { whatsappMessageId: messageId },
      data: {
        status: statusValue,
        ...(statusValue === 'delivered' && { deliveredAt: new Date(parseInt(timestamp) * 1000) }),
        ...(statusValue === 'read' && { readAt: new Date(parseInt(timestamp) * 1000) }),
        ...(statusValue === 'failed' && { 
          status: 'failed',
          failedAt: new Date(),
          error: status.errors?.[0]?.message || 'Unknown error'
        })
      }
    });

    // Update campaign message status
    await prisma.campaignMessage.updateMany({
      where: { whatsappMessageId: messageId },
      data: {
        status: statusValue,
        ...(statusValue === 'delivered' && { deliveredAt: new Date(parseInt(timestamp) * 1000) }),
        ...(statusValue === 'read' && { readAt: new Date(parseInt(timestamp) * 1000) }),
        ...(statusValue === 'failed' && {
          status: 'failed',
          failedAt: new Date(),
          error: status.errors?.[0]?.message || 'Unknown error'
        })
      }
    });

    // Emit status update via socket
    const messages = await prisma.message.findMany({
      where: { whatsappMessageId: messageId },
      select: { conversationId: true }
    });

    const socketService = getSocketService();
    if (socketService && messages.length > 0) {
      socketService.emitMessageStatusUpdate(
        messages[0].conversationId,
        messageId,
        statusValue
      );
    }

  } catch (error: any) {
    console.error('Error handling message status:', error);
  }
}

export default router;
