import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { createCampaignSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';
import { startCampaign, cancelCampaign as cancelCampaignQueue } from '../services/campaignQueue';
import { AuditLogService } from '../services/auditLog';

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

    const campaign = await prisma.campaign.create({
      data: {
        ...validatedData,
        userId: req.user!.id,
        totalMessages: customerCount,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null
      },
      include: {
        template: true
      }
    });

    // Create campaign schedule if settings provided
    if (req.body.schedule) {
      await prisma.campaignSchedule.create({
        data: {
          campaignId: campaign.id,
          timezone: req.body.schedule.timezone || 'UTC',
          throttleRate: req.body.schedule.throttleRate || 10,
          retryAttempts: req.body.schedule.retryAttempts || 3,
          retryDelay: req.body.schedule.retryDelay || 60,
          windowStart: req.body.schedule.windowStart || null,
          windowEnd: req.body.schedule.windowEnd || null
        }
      });
    }

    // Audit log
    await AuditLogService.logCampaignCreated(
      req.user!.id,
      campaign.id,
      campaign,
      req
    );

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

    // Start campaign using queue system
    await startCampaign(id, req.user!.id);

    // Audit log
    await AuditLogService.logCampaignSent(
      req.user!.id,
      id,
      { totalMessages: campaignMessages.length },
      req
    );

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
        status: 'cancelled'
      }
    });

    // Cancel queued jobs
    await cancelCampaignQueue(id);

    // Audit log
    await AuditLogService.logCampaignCancelled(
      req.user!.id,
      id,
      'User cancelled campaign',
      req
    );

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

// Get campaign logs
router.get('/:id/logs', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!campaign) {
      throw createError('Campaign not found', 404);
    }

    const [logs, total] = await Promise.all([
      prisma.campaignLog.findMany({
        where: { campaignId: id },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.campaignLog.count({
        where: { campaignId: id }
      })
    ]);

    res.json({
      success: true,
      data: {
        logs,
        total
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;