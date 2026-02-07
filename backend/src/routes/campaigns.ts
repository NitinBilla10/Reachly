import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { createCampaignSchema, updateCampaignSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';
import { campaignQueue } from '../services/queue';
import { getSocketService } from '../services/socket';

const router = Router();

// Get all campaigns
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: req.user!.id
    };

    if (status) {
      where.status = status;
    }

    const [campaigns, totalCount] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          targetTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
          },
          _count: {
            select: {
              campaignMessages: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.campaign.count({ where })
    ]);

    const formattedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      targetTags: campaign.targetTags.map(tt => tt.tag)
    }));

    res.json({
      success: true,
      data: {
        campaigns: formattedCampaigns,
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
        targetTags: {
          include: {
            tag: true
          }
        },
        campaignMessages: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 100
        }
      }
    });

    if (!campaign) {
      throw createError('Campaign not found', 404);
    }

    const formattedCampaign = {
      ...campaign,
      targetTags: campaign.targetTags.map(tt => tt.tag)
    };

    res.json({
      success: true,
      data: formattedCampaign
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new campaign
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createCampaignSchema.parse(req.body);

    // Validate template exists and belongs to user
    const template = await prisma.template.findFirst({
      where: {
        id: validatedData.templateId,
        userId: req.user!.id
      }
    });

    if (!template) {
      throw createError('Template not found', 404);
    }

    // Validate tags if provided
    if (validatedData.tagIds && validatedData.tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: {
          id: { in: validatedData.tagIds },
          userId: req.user!.id
        }
      });

      if (tags.length !== validatedData.tagIds.length) {
        throw createError('One or more tags not found', 400);
      }
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        templateId: validatedData.templateId,
        userId: req.user!.id,
        status: validatedData.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        ...(validatedData.tagIds && validatedData.tagIds.length > 0 && {
          targetTags: {
            create: validatedData.tagIds.map(tagId => ({ tagId }))
          }
        })
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        targetTags: {
          include: {
            tag: true
          }
        }
      }
    });

    // If scheduled, add to queue
    if (validatedData.scheduledAt) {
      const delay = new Date(validatedData.scheduledAt).getTime() - Date.now();
      if (delay > 0) {
        await campaignQueue.add(
          'send-campaign',
          { campaignId: campaign.id, userId: req.user!.id },
          { delay }
        );
      }
    }

    const formattedCampaign = {
      ...campaign,
      targetTags: campaign.targetTags.map(tt => tt.tag)
    };

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: formattedCampaign
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

// Update campaign
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateCampaignSchema.parse(req.body);

    // Check if campaign exists and belongs to user
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingCampaign) {
      throw createError('Campaign not found', 404);
    }

    // Cannot update campaign that's already sending or completed
    if (['sending', 'completed'].includes(existingCampaign.status)) {
      throw createError('Cannot update campaign that is already sending or completed', 400);
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: validatedData
    });

    res.json({
      success: true,
      message: 'Campaign updated successfully',
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
    const { tagIds } = req.body;

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

    // Update tag targets if provided
    if (tagIds && tagIds.length > 0) {
      // Delete existing targets
      await prisma.campaignTargetTag.deleteMany({
        where: { campaignId: id }
      });

      // Create new targets
      await prisma.campaignTargetTag.createMany({
        data: tagIds.map((tagId: string) => ({
          campaignId: id,
          tagId
        }))
      });
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id },
      data: {
        status: 'sending',
        startedAt: new Date()
      }
    });

    // Add to queue
    await campaignQueue.add('send-campaign', {
      campaignId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Campaign is being sent',
      data: { campaignId: id, status: 'sending' }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel campaign
router.post('/:id/cancel', async (req: AuthRequest, res: Response) => {
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

    if (!['scheduled', 'sending'].includes(campaign.status)) {
      throw createError('Only scheduled or sending campaigns can be cancelled', 400);
    }

    await prisma.campaign.update({
      where: { id },
      data: {
        status: 'cancelled',
        completedAt: new Date()
      }
    });

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

// Delete campaign
router.delete('/:id', async (req: AuthRequest, res: Response) => {
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

    // Cannot delete sending campaign
    if (campaign.status === 'sending') {
      throw createError('Cannot delete campaign that is currently sending', 400);
    }

    await prisma.campaign.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
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

    // Get message status breakdown
    const statusCounts = await prisma.campaignMessage.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: {
        status: true
      }
    });

    // Get hourly delivery stats
    const hourlyStats = await prisma.campaignMessage.groupBy({
      by: ['sentAt'],
      where: {
        campaignId: id,
        sentAt: { not: null }
      },
      _count: {
        id: true
      }
    });

    const statusBreakdown = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const analytics = {
      overview: {
        total: campaign.totalMessages,
        sent: campaign.sentMessages,
        delivered: campaign.deliveredMessages,
        read: campaign.readMessages,
        failed: campaign.failedMessages,
        pending: campaign.totalMessages - campaign.sentMessages - campaign.failedMessages
      },
      rates: {
        deliveryRate: campaign.sentMessages > 0 
          ? ((campaign.deliveredMessages / campaign.sentMessages) * 100).toFixed(2)
          : '0',
        readRate: campaign.deliveredMessages > 0
          ? ((campaign.readMessages / campaign.deliveredMessages) * 100).toFixed(2)
          : '0',
        failureRate: campaign.totalMessages > 0
          ? ((campaign.failedMessages / campaign.totalMessages) * 100).toFixed(2)
          : '0'
      },
      statusBreakdown,
      hourlyStats
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
