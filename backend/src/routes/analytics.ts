import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get dashboard overview statistics
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    const startDate = getStartDate(period as string);

    // Get basic counts
    const [
      totalCustomers,
      totalTags,
      totalTemplates,
      totalCampaigns,
      totalMessages,
      activeConversations
    ] = await Promise.all([
      prisma.customer.count({ where: { userId: req.user!.id } }),
      prisma.tag.count({ where: { userId: req.user!.id } }),
      prisma.template.count({ where: { userId: req.user!.id } }),
      prisma.campaign.count({ where: { userId: req.user!.id } }),
      prisma.message.count({
        where: {
          conversation: {
            userId: req.user!.id
          },
          sentAt: {
            gte: startDate
          }
        }
      }),
      prisma.conversation.count({
        where: {
          userId: req.user!.id,
          status: 'active',
          updatedAt: {
            gte: startDate
          }
        }
      })
    ]);

    // Get message statistics
    const messageStats = await prisma.message.groupBy({
      by: ['direction'],
      where: {
        conversation: {
          userId: req.user!.id
        },
        sentAt: {
          gte: startDate
        }
      },
      _count: {
        direction: true
      }
    });

    // Get campaign statistics
    const campaignStats = await prisma.campaign.groupBy({
      by: ['status'],
      where: {
        userId: req.user!.id,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        status: true
      }
    });

    // Get recent activity
    const recentMessages = await prisma.message.findMany({
      where: {
        conversation: {
          userId: req.user!.id
        }
      },
      include: {
        conversation: {
          include: {
            customer: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Get top tags by customer count
    const topTags = await prisma.tag.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        _count: {
          select: {
            customers: true
          }
        }
      },
      orderBy: {
        customers: {
          _count: 'desc'
        }
      },
      take: 5
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          totalTags,
          totalTemplates,
          totalCampaigns,
          totalMessages,
          activeConversations,
          period
        },
        messageStats,
        campaignStats,
        recentMessages,
        topTags
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get message analytics over time
router.get('/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;
    
    const startDate = getStartDate(period as string);
    const interval = getInterval(groupBy as string);

    // Get message counts over time
    const messageAnalytics = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('${interval}', "sentAt") as date,
        direction,
        COUNT(*) as count
      FROM "messages" m
      JOIN "conversations" c ON m."conversationId" = c.id
      WHERE c."userId" = ${req.user!.id}
        AND m."sentAt" >= ${startDate}
      GROUP BY DATE_TRUNC('${interval}', "sentAt"), direction
      ORDER BY date ASC
    `;

    // Get delivery rate
    const deliveryStats = await prisma.message.groupBy({
      by: ['status'],
      where: {
        conversation: {
          userId: req.user!.id
        },
        direction: 'outbound',
        sentAt: {
          gte: startDate
        }
      },
      _count: {
        status: true
      }
    });

    res.json({
      success: true,
      data: {
        messageAnalytics,
        deliveryStats
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get campaign analytics
router.get('/campaigns', async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    const startDate = getStartDate(period as string);

    // Get campaign performance
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: req.user!.id,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        template: true,
        campaignMessages: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate campaign statistics
    const campaignStats = campaigns.map(campaign => {
      const total = campaign.campaignMessages.length;
      const sent = campaign.campaignMessages.filter(m => m.status === 'sent').length;
      const delivered = campaign.campaignMessages.filter(m => m.status === 'delivered').length;
      const failed = campaign.campaignMessages.filter(m => m.status === 'failed').length;

      return {
        ...campaign,
        statistics: {
          total,
          sent,
          delivered,
          failed,
          deliveryRate: total > 0 ? (delivered / total * 100).toFixed(2) : 0,
          successRate: total > 0 ? (sent / total * 100).toFixed(2) : 0
        }
      };
    });

    // Get campaign performance over time
    const campaignPerformance = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', c."createdAt") as date,
        COUNT(*) as total_campaigns,
        SUM(c."totalMessages") as total_messages,
        SUM(c."sentMessages") as sent_messages,
        SUM(c."deliveredMessages") as delivered_messages,
        SUM(c."failedMessages") as failed_messages
      FROM "campaigns" c
      WHERE c."userId" = ${req.user!.id}
        AND c."createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', c."createdAt")
      ORDER BY date ASC
    `;

    res.json({
      success: true,
      data: {
        campaigns: campaignStats,
        performance: campaignPerformance
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get customer analytics
router.get('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    const startDate = getStartDate(period as string);

    // Get customer growth over time
    const customerGrowth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM "customers"
      WHERE "userId" = ${req.user!.id}
        AND "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;

    // Get customers by tag
    const customersByTag = await prisma.tag.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        _count: {
          select: {
            customers: true
          }
        }
      }
    });

    // Get most active customers (by message count)
    const mostActiveCustomers = await prisma.customer.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        _count: {
          select: {
            messages: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        messages: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Get recent customers
    const recentCustomers = await prisma.customer.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    res.json({
      success: true,
      data: {
        customerGrowth,
        customersByTag,
        mostActiveCustomers,
        recentCustomers
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get template analytics
router.get('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    const startDate = getStartDate(period as string);

    // Get template usage statistics
    const templates = await prisma.template.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        _count: {
          select: {
            campaignMessages: true,
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get most used templates
    const popularTemplates = await prisma.template.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        campaignMessages: {
          where: {
            createdAt: {
              gte: startDate
            }
          }
        },
        _count: {
          select: {
            campaignMessages: true,
            messages: true
          }
        }
      },
      orderBy: {
        campaignMessages: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Calculate template performance
    const templateStats = popularTemplates.map(template => {
      const campaignMessages = template.campaignMessages;
      const total = campaignMessages.length;
      const sent = campaignMessages.filter(m => m.status === 'sent').length;
      const delivered = campaignMessages.filter(m => m.status === 'delivered').length;
      const failed = campaignMessages.filter(m => m.status === 'failed').length;

      return {
        ...template,
        statistics: {
          total,
          sent,
          delivered,
          failed,
          deliveryRate: total > 0 ? (delivered / total * 100).toFixed(2) : 0
        }
      };
    });

    res.json({
      success: true,
      data: {
        templates,
        popularTemplates: templateStats
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get conversation analytics
router.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    const startDate = getStartDate(period as string);

    // Get conversation statistics
    const totalConversations = await prisma.conversation.count({
      where: {
        userId: req.user!.id,
        createdAt: {
          gte: startDate
        }
      }
    });

    const activeConversations = await prisma.conversation.count({
      where: {
        userId: req.user!.id,
        status: 'active',
        updatedAt: {
          gte: startDate
        }
      }
    });

    // Get conversation response times
    const responseTimes = await prisma.$queryRaw`
      SELECT 
        c.id,
        c."customerId",
        cu.name as customer_name,
        m_inbound."sentAt" as inbound_time,
        m_outbound."sentAt" as outbound_time,
        EXTRACT(EPOCH FROM (m_outbound."sentAt" - m_inbound."sentAt"))/60 as response_time_minutes
      FROM "conversations" c
      JOIN "customers" cu ON c."customerId" = cu.id
      JOIN "messages" m_inbound ON c.id = m_inbound."conversationId" 
        AND m_inbound.direction = 'inbound'
      JOIN "messages" m_outbound ON c.id = m_outbound."conversationId" 
        AND m_outbound.direction = 'outbound'
      WHERE c."userId" = ${req.user!.id}
        AND m_inbound."sentAt" >= ${startDate}
        AND m_outbound."sentAt" > m_inbound."sentAt"
      ORDER BY m_inbound."sentAt" DESC
      LIMIT 100
    `;

    // Calculate average response time
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum: number, conv: any) => sum + parseFloat(conv.response_time_minutes || 0), 0) / responseTimes.length
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalConversations,
          activeConversations,
          avgResponseTime: Math.round(avgResponseTime)
        },
        conversations: responseTimes
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to get start date based on period
function getStartDate(period: string): Date {
  const now = new Date();
  
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

// Helper function to get interval for grouping
function getInterval(groupBy: string): string {
  switch (groupBy) {
    case 'hour':
      return 'hour';
    case 'day':
      return 'day';
    case 'week':
      return 'week';
    case 'month':
      return 'month';
    default:
      return 'day';
  }
}

export default router;