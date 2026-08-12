import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { sendMessageSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';
import { WhatsAppService } from '../services/whatsapp';
import { getSocketService } from '../services/socket';

const router = Router();

// Get all conversations
router.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        customer: true,
        _count: {
          select: {
            messages: {
              where: {
                direction: 'inbound'
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get conversation messages
router.get('/conversations/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Check if conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id
      },
      include: {
        template: true,
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        conversation
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Send message
router.post('/send', async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);

    let conversation;

    if (validatedData.conversationId) {
      // Verify conversation belongs to user
      conversation = await prisma.conversation.findFirst({
        where: {
          id: validatedData.conversationId,
          userId: req.user!.id
        },
        include: {
          customer: true
        }
      });
    } else if (validatedData.customerId) {
      // Find existing conversation for this customer or create a new one
      conversation = await prisma.conversation.findFirst({
        where: {
          customerId: validatedData.customerId,
          userId: req.user!.id
        },
        include: {
          customer: true
        }
      });

      if (!conversation) {
        // We need the customer to create the conversation and for the phone number
        const customer = await prisma.customer.findFirst({
          where: {
            id: validatedData.customerId,
            userId: req.user!.id
          }
        });

        if (!customer) {
          throw createError('Customer not found', 404);
        }

        conversation = await prisma.conversation.create({
          data: {
            userId: req.user!.id,
            customerId: customer.id,
            status: 'active'
          },
          include: {
            customer: true
          }
        });
      }
    }

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    let messageContent = validatedData.content;
    let templateId = null;

    // If using a template, process it
    if (validatedData.messageType === 'template' && validatedData.templateId) {
      const template = await prisma.template.findFirst({
        where: {
          id: validatedData.templateId,
          userId: req.user!.id
        }
      });

      if (!template) {
        throw createError('Template not found', 404);
      }

      templateId = template.id;

      // Replace template variables
      if (validatedData.templateVariables) {
        messageContent = template.content;
        Object.entries(validatedData.templateVariables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          messageContent = messageContent.replace(regex, String(value));
        });
      }
    }

    // Send message via WhatsApp API
    const whatsappService = new WhatsAppService();
    const result = await whatsappService.sendTextMessage(
      req.user!.id,
      conversation.customer.phone,
      messageContent
    );

    if (!result.success) {
      throw createError(`Failed to send message: ${result.error}`, 400);
    }

    // Create message record
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        customerId: conversation.customerId,
        templateId,
        content: messageContent,
        messageType: validatedData.messageType,
        direction: 'outbound',
        whatsappMessageId: result.messageId,
        status: 'sent'
      },
      include: {
        template: true,
        customer: true
      }
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Emit real-time update
    const socketService = getSocketService();
    if (socketService) {
      socketService.emitNewMessage(conversation.id, message);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark message as read
router.put('/messages/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id,
        conversation: {
          userId: req.user!.id
        }
      }
    });

    if (!message) {
      throw createError('Message not found', 404);
    }

    if (message.direction !== 'inbound') {
      throw createError('Can only mark inbound messages as read', 400);
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        status: 'read',
        readAt: new Date()
      }
    });

    // Emit real-time update
    const socketService = getSocketService();
    if (socketService) {
      socketService.emitMessageStatusUpdate(message.conversationId, id, 'read');
    }

    res.json({
      success: true,
      message: 'Message marked as read',
      data: updatedMessage
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Archive conversation
router.put('/conversations/:id/archive', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        status: 'archived'
      }
    });

    res.json({
      success: true,
      message: 'Conversation archived',
      data: updatedConversation
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Unarchive conversation
router.put('/conversations/:id/unarchive', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        status: 'active'
      }
    });

    res.json({
      success: true,
      message: 'Conversation unarchived',
      data: updatedConversation
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get unread message count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const unreadCount = await prisma.message.count({
      where: {
        conversation: {
          userId: req.user!.id,
          status: 'active'
        },
        direction: 'inbound',
        status: { not: 'read' }
      }
    });

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Search messages
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query) {
      throw createError('Search query is required', 400);
    }

    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          userId: req.user!.id
        },
        content: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include: {
        conversation: {
          include: {
            customer: true
          }
        },
        template: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;