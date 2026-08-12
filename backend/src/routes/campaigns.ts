import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { createCampaignSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';
import { WhatsAppService } from '../services/whatsapp';
import { getSocketService } from '../services/socket';

const router = Router();

// Get all campaigns
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        template: true,
        _count: {
          select: {
            campaignMessages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get campaign by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        template: true,
        campaignMessages: {
          include: {
            customer: true,
            tag: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!campaign) {
      throw createError('Campaign not found', 404);
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new campaign (without sending)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createCampaignSchema.parse(req.body);

    // Verify template belongs to user
    const template = await prisma.template.findFirst({
      where: {
        id: validatedData.templateId,
        userId: req.user!.id
      }
    });

    if (!template) {
      throw createError('Template not found', 404);
    }

    // Verify tags belong to user
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: validatedData.tagIds },
        userId: req.user!.id
      }
    });

    if (tags.length !== validatedData.tagIds.length) {
      throw createError('One or more tags not found', 400);
    }

    // Count customers that will receive the campaign
    const customerCount = await prisma.customer.count({
      where: {
        userId: req.user!.id,
        tags: {
          some: {
            tagId: { in: validatedData.tagIds }
          }
        }
      }
    });

    if (customerCount === 0) {
      throw createError('No customers found with the selected tags', 400);
    }

    const { tagIds, ...campaignData } = validatedData;

    const campaign = await prisma.campaign.create({
      data: {
        ...campaignData,
        userId: req.user!.id,
        totalMessages: customerCount,
        scheduledAt: campaignData.scheduledAt ? new Date(campaignData.scheduledAt) : null
      },
      include: {
        template: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
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

// Send campaign
router.post('/:id/send', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        template: true
      }
    });

    if (!campaign) {
      throw createError('Campaign not found', 404);
    }

    if (campaign.status !== 'draft') {
      throw createError('Only draft campaigns can be sent', 400);
    }

    // Get customers with selected tags
    const customers = await prisma.customer.findMany({
      where: {
        userId: req.user!.id,
        tags: {
          some: {
            tagId: { in: req.body.tagIds || [] }
          }
        }
      },
      include: {
        tags: {
          where: {
            tagId: { in: req.body.tagIds || [] }
          },
          include: {
            tag: true
          }
        }
      }
    });

    if (customers.length === 0) {
      throw createError('No customers found with the selected tags', 400);
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id },
      data: {
        status: 'sending',
        startedAt: new Date()
      }
    });

    // Create campaign messages
    const campaignMessages = await Promise.all(
      customers.map(customer => {
        // Replace template variables with customer data
        let messageContent = campaign.template.content;
        
        // Basic variable replacement
        if (campaign.template.variables) {
          const variables = campaign.template.variables as string[];
          variables.forEach(variable => {
            const value = (customer as any)[variable] || '';
            messageContent = messageContent.replace(
              new RegExp(`{{${variable}}}`, 'g'),
              String(value)
            );
          });
        }

        return prisma.campaignMessage.create({
          data: {
            campaignId: id,
            customerId: customer.id,
            templateId: campaign.templateId,
            content: messageContent,
            tagId: customer.tags[0]?.tagId // Use first tag
          }
        });
      })
    );

    // Start sending messages asynchronously
    processCampaignMessages(campaign.id, req.user!.id);

    res.json({
      success: true,
      message: 'Campaign sending started',
      data: {
        campaignId: id,
        totalMessages: campaignMessages.length
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel campaign
router.put('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!campaign) {
      throw createError('Campaign not found', 404);
    }

    if (campaign.status !== 'sending') {
      throw createError('Only sending campaigns can be cancelled', 400);
    }

    // Mark pending messages as cancelled
    await prisma.campaignMessage.updateMany({
      where: {
        campaignId: id,
        status: 'pending'
      },
      data: {
        status: 'failed',
        failedAt: new Date(),
        error: 'Campaign cancelled by user'
      }
    });

    // Update campaign status
    await prisma.campaign.update({
      where: { id },
      data: {
        status: 'failed'
      }
    });

    // Emit real-time update
    const socketService = getSocketService();
    if (socketService) {
      socketService.emitCampaignUpdate(req.user!.id, id, {
        type: 'cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Campaign cancelled successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get campaign analytics
router.get('/:id/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!campaign) {
      throw createError('Campaign not found', 404);
    }

    const messageStats = await prisma.campaignMessage.groupBy({
      by: ['status'],
      where: {
        campaignId: id
      },
      _count: {
        status: true
      }
    });

    const recentMessages = await prisma.campaignMessage.findMany({
      where: {
        campaignId: id
      },
      include: {
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    res.json({
      success: true,
      data: {
        campaign,
        messageStats,
        recentMessages
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to process campaign messages
async function processCampaignMessages(campaignId: string, userId: string) {
  try {
    const whatsappService = new WhatsAppService();
    const socketService = getSocketService();

    const campaignMessages = await prisma.campaignMessage.findMany({
      where: {
        campaignId,
        status: 'pending'
      },
      include: {
        customer: true,
        template: true
      }
    });

    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    for (const message of campaignMessages) {
      try {
        // Send message via WhatsApp API
        const result = await whatsappService.sendTemplateMessage(
          userId,
          message.customer.phone,
          message.template.name, // Template name comes from template relation
          'en_US'
        );

        if (result.success) {
          await prisma.campaignMessage.update({
            where: { id: message.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
              whatsappMessageId: result.messageId
            }
          });
          sentCount++;
        } else {
          await prisma.campaignMessage.update({
            where: { id: message.id },
            data: {
              status: 'failed',
              failedAt: new Date(),
              error: result.error
            }
          });
          failedCount++;
        }

        // Emit real-time update
        if (socketService) {
          socketService.emitCampaignUpdate(userId, campaignId, {
            type: 'message_sent',
            messageId: message.id,
            status: result.success ? 'sent' : 'failed'
          });
        }

        // Rate limiting - wait 1 second between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        await prisma.campaignMessage.update({
          where: { id: message.id },
          data: {
            status: 'failed',
            failedAt: new Date(),
            error: 'Failed to send message'
          }
        });
        failedCount++;
      }
    }

    // Update campaign with final counts
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        sentMessages: sentCount,
        failedMessages: failedCount
      }
    });

    // Emit final campaign update
    if (socketService) {
      socketService.emitCampaignUpdate(userId, campaignId, {
        type: 'completed',
        sentCount,
        failedCount,
        deliveredCount
      });
    }
  } catch (error) {
    console.error('Campaign processing error:', error);
    
    // Mark campaign as failed
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'failed'
      }
    });
  }
}

export default router;