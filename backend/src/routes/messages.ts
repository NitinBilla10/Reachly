import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { sendMessageSchema, sendBulkMessageSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';
import { messageQueue } from '../services/queue';
import { getSocketService } from '../services/socket';

const router = Router();

// Get all conversations
router.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: req.user!.id
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } }
        ]
      };
    }

    const [conversations, totalCount] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              profileImage: true,
              isBlocked: true
            }
          },
          messages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: [
          { isPinned: 'desc' },
          { lastMessageAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.conversation.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single conversation
router.get('/conversations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        customer: {
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            contactType: true
          }
        }
      }
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    res.json({
      success: true,
      data: conversation
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
    const { page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Check if conversation exists and belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId: id
        },
        include: {
          template: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.message.count({
        where: { conversationId: id }
      })
    ]);

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        direction: 'inbound',
        status: { not: 'read' }
      },
      data: {
        status: 'read',
        readAt: new Date()
      }
    });

    // Reset unread count
    await prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 }
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
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

    // Get conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: validatedData.conversationId,
        userId: req.user!.id
      },
      include: {
        customer: true
      }
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    if (conversation.customer.isBlocked) {
      throw createError('Cannot send messages to blocked customers', 400);
    }

    // Check 24-hour window
    const canSendFree = conversation.customer.windowExpiresAt && conversation.customer.windowExpiresAt > new Date();
    
    if (!canSendFree && validatedData.messageType !== 'template') {
      throw createError('Cannot send free-form messages outside 24-hour window. Use templates instead.', 400);
    }

    // Create message record
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        customerId: conversation.customer.id,
        userId: req.user!.id,
        content: validatedData.content,
        messageType: validatedData.messageType,
        direction: 'outbound',
        status: 'pending',
        templateId: validatedData.templateId,
        mediaUrl: validatedData.mediaUrl,
        mediaCaption: validatedData.mediaCaption
      }
    });

    // Add to queue for sending
    await messageQueue.add('send-message', {
      userId: req.user!.id,
      customerId: conversation.customer.id,
      conversationId: conversation.id,
      messageId: message.id,
      content: validatedData.content,
      messageType: validatedData.messageType,
      templateId: validatedData.templateId,
      templateVariables: validatedData.templateVariables
    });

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() }
    });

    // Emit to socket
    const socketService = getSocketService();
    if (socketService) {
      socketService.emitNewMessage(conversation.id, message);
    }

    res.json({
      success: true,
      message: 'Message queued for sending',
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

// Send bulk messages
router.post('/send-bulk', async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = sendBulkMessageSchema.parse(req.body);

    const results = {
      queued: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const customerId of validatedData.customerIds) {
      try {
        // Find or create conversation
        let conversation = await prisma.conversation.findFirst({
          where: {
            customerId,
            userId: req.user!.id
          }
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              userId: req.user!.id,
              customerId
            }
          });
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            customerId,
            userId: req.user!.id,
            content: validatedData.content,
            messageType: validatedData.messageType,
            direction: 'outbound',
            status: 'pending',
            templateId: validatedData.templateId
          }
        });

        // Add to queue
        await messageQueue.add('send-message', {
          userId: req.user!.id,
          customerId,
          conversationId: conversation.id,
          messageId: message.id,
          content: validatedData.content,
          messageType: validatedData.messageType,
          templateId: validatedData.templateId,
          templateVariables: validatedData.templateVariables
        }, {
          delay: results.queued * 100 // 100ms delay between each message
        });

        results.queued++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Customer ${customerId}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Bulk send initiated. ${results.queued} messages queued, ${results.failed} failed.`,
      data: results
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

// Archive conversation
router.post('/conversations/:id/archive', async (req: AuthRequest, res: Response) => {
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

    await prisma.conversation.update({
      where: { id },
      data: { status: 'archived' }
    });

    res.json({
      success: true,
      message: 'Conversation archived successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Unarchive conversation
router.post('/conversations/:id/unarchive', async (req: AuthRequest, res: Response) => {
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

    await prisma.conversation.update({
      where: { id },
      data: { status: 'active' }
    });

    res.json({
      success: true,
      message: 'Conversation unarchived successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Pin conversation
router.post('/conversations/:id/pin', async (req: AuthRequest, res: Response) => {
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

    await prisma.conversation.update({
      where: { id },
      data: { isPinned: true }
    });

    res.json({
      success: true,
      message: 'Conversation pinned successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Unpin conversation
router.post('/conversations/:id/unpin', async (req: AuthRequest, res: Response) => {
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

    await prisma.conversation.update({
      where: { id },
      data: { isPinned: false }
    });

    res.json({
      success: true,
      message: 'Conversation unpinned successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get unread count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.conversation.aggregate({
      where: {
        userId: req.user!.id,
        status: 'active'
      },
      _sum: {
        unreadCount: true
      }
    });

    res.json({
      success: true,
      data: {
        unreadCount: result._sum.unreadCount || 0
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
    const { q, limit = '20' } = req.query;

    if (!q) {
      throw createError('Search query is required', 400);
    }

    const limitNum = parseInt(limit as string);

    const messages = await prisma.message.findMany({
      where: {
        userId: req.user!.id,
        content: {
          contains: q as string,
          mode: 'insensitive'
        }
      },
      include: {
        conversation: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limitNum
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
