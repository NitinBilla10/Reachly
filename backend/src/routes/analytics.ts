import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Helper function to get date range
function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '24h':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate, endDate };
}

// Get overview analytics
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as string) || '30d';
    const { startDate, endDate } = getDateRange(period);

    // Get counts
    const [
      totalCustomers,
      newCustomers,
      totalMessages,
      sentMessages,
      deliveredMessages,
      readMessages,
      failedMessages,
      totalConversations,
      activeConversations,
      totalCampaigns,
      sentCampaigns
    ] = await Promise.all([
      prisma.customer.count({
        where: { userId: req.user!.id }
      }),
      prisma.customer.count({
        where: {
          userId: req.user!.id,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.message.count({
        where: {
          userId: req.user!.id,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.message.count({
        where: {
          userId: req.user!.id,
          direction: 'outbound',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.message.count({
        where: {
          userId: req.user!.id,
          direction: 'outbound',
          status: { in: ['delivered', 'read'] },
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.message.count({
        where: {
          userId: req.user!.id,
          direction: 'outbound',
          status: 'read',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.message.count({
        where: {
          userId: req.user!.id,
          direction: 'outbound',
          status: 'failed',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.conversation.count({
        where: { userId: req.user!.id }
      }),
      prisma.conversation.count({
        where: {
          userId: req.user!.id,
          lastMessageAt: { gte: startDate }
        }
      }),
      prisma.campaign.count({
        where: { userId: req.user!.id }
      }),
      prisma.campaign.count({
        where: {
          userId: req.user!.id,
          status: { in: ['sending', 'completed'] },
          createdAt: { gte: startDate, lte: endDate }
        }
      })
    ]);

    // Calculate rates
    const deliveryRate = sentMessages > 0 ? ((deliveredMessages / sentMessages) * 100).toFixed(2) : '0';
    const readRate = deliveredMessages > 0 ? ((readMessages / deliveredMessages) * 100).toFixed(2) : '0';

    // Get daily message counts
    const dailyMessages = await prisma.message.groupBy({
      by: ['createdAt'],
      where: {
        userId: req.user!.id,
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: {
        id: true
      }
    });

    // Format daily data
    const messageTrend = dailyMessages.map(day => ({
      date: day.createdAt.toISOString().split('T')[0],
      count: day._count.id
    }));

    res.json({
      success: true,
      data: {
        customers: {
          total: totalCustomers,
          new: newCustomers
        },
        messages: {
          total: totalMessages,
          sent: sentMessages,
          delivered: deliveredMessages,
          read: readMessages,
          failed: failedMessages,
          deliveryRate,
          readRate
        },
        conversations: {
          total: totalConversations,
          active: activeConversations
        },
        campaigns: {
          total: totalCampaigns,
          sent: sentCampaigns
        },
        messageTrend
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get message analytics
router.get('/messages', async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as string) || '30d';
    const groupBy = (req.query.groupBy as string) || 'day';
    const { startDate, endDate } = getDateRange(period);

    // Get message statistics
    const messages = await prisma.message.findMany({
      where: {
        userId: req.user!.id,
        createdAt: { gte: startDate, lte: endDate }
      },
      select: {
        createdAt: true,
        direction: true,
        status: true,
        messageType: true
      }
    });

    // Group by time period
    const groupedData = messages.reduce((acc, message) => {
      let key: string;
      const date = new Date(message.createdAt);
      
      if (groupBy === 'hour') {
        key = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`;
      } else if (groupBy === 'week') {
        const weekNum = Math.ceil((date.getDate()) / 7);
        key = `${date.getFullYear()}-W${weekNum}`;
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!acc[key]) {
        acc[key] = {
          date: key,
          total: 0,
          inbound: 0,
          outbound: 0,
          delivered: 0,
          read: 0,
          failed: 0
        };
      }

      acc[key].total++;
      acc[key][message.direction]++;
      
      if (message.status === 'delivered' || message.status === 'read') {
        acc[key].delivered++;
      }
      if (message.status === 'read') {
        acc[key].read++;
      }
      if (message.status === 'failed') {
        acc[key].failed++;
      }

      return acc;
    }, {} as Record<string, any>);

    // Get message type breakdown
    const typeBreakdown = messages.reduce((acc, message) => {
      acc[message.messageType] = (acc[message.messageType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        timeline: Object.values(groupedData),
        typeBreakdown,
        total: messages.length
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
    const period = (req.query.period as string) || '30d';
    const { startDate, endDate } = getDateRange(period);

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: req.user!.id,
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        template: {
          select: {
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate statistics
    const stats = campaigns.reduce((acc, campaign) => {
      acc.totalMessages += campaign.totalMessages;
      acc.sentMessages += campaign.sentMessages;
      acc.deliveredMessages += campaign.deliveredMessages;
      acc.readMessages += campaign.readMessages;
      acc.failedMessages += campaign.failedMessages;
      
      if (campaign.status === 'completed') acc.completed++;
      if (campaign.status === 'failed') acc.failed++;
      if (campaign.status === 'sending') acc.active++;

      return acc;
    }, {
      totalMessages: 0,
      sentMessages: 0,
      deliveredMessages: 0,
      readMessages: 0,
      failedMessages: 0,
      completed: 0,
      failed: 0,
      active: 0
    });

    const deliveryRate = stats.sentMessages > 0 
      ? ((stats.deliveredMessages / stats.sentMessages) * 100).toFixed(2)
      : '0';

    const readRate = stats.deliveredMessages > 0
      ? ((stats.readMessages / stats.deliveredMessages) * 100).toFixed(2)
      : '0';

    res.json({
      success: true,
      data: {
        campaigns,
        stats: {
          ...stats,
          deliveryRate,
          readRate
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

// Get customer analytics
router.get('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as string) || '30d';
    const { startDate, endDate } = getDateRange(period);

    // Get customer growth
    const dailyGrowth = await prisma.customer.groupBy({
      by: ['createdAt'],
      where: {
        userId: req.user!.id,
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: {
        id: true
      }
    });

    // Get customers by contact type
    const byContactType = await prisma.customer.groupBy({
      by: ['contactTypeId'],
      where: {
        userId: req.user!.id
      },
      _count: {
        id: true
      }
    });

    // Get contact type names
    const contactTypeIds = byContactType
      .filter(ct => ct.contactTypeId !== null)
      .map(ct => ct.contactTypeId!);

    const contactTypes = await prisma.contactType.findMany({
      where: {
        id: { in: contactTypeIds }
      },
      select: {
        id: true,
        name: true,
        color: true
      }
    });

    const contactTypeMap = contactTypes.reduce((acc, ct) => {
      acc[ct.id] = ct;
      return acc;
    }, {} as Record<string, any>);

    const byContactTypeFormatted = byContactType.map(ct => ({
      contactType: ct.contactTypeId ? contactTypeMap[ct.contactTypeId] : { name: 'Uncategorized', color: '#9CA3AF' },
      count: ct._count.id
    }));

    // Get opt-in stats
    const optInStats = await prisma.customer.groupBy({
      by: ['optIn'],
      where: { userId: req.user!.id },
      _count: {
        id: true
      }
    });

    // Get active customers (with messages in period)
    const activeCustomers = await prisma.message.groupBy({
      by: ['customerId'],
      where: {
        userId: req.user!.id,
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: {
        customerId: true
      }
    });

    res.json({
      success: true,
      data: {
        growth: dailyGrowth.map(day => ({
          date: day.createdAt.toISOString().split('T')[0],
          count: day._count.id
        })),
        byContactType: byContactTypeFormatted,
        optInStats,
        activeCount: activeCustomers.length
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
    const period = (req.query.period as string) || '30d';
    const { startDate, endDate } = getDateRange(period);

    // Get template usage
    const templateUsage = await prisma.message.groupBy({
      by: ['templateId'],
      where: {
        userId: req.user!.id,
        templateId: { not: null },
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: {
        id: true
      }
    });

    // Get template details
    const templateIds = templateUsage.map(t => t.templateId!);
    const templates = await prisma.template.findMany({
      where: {
        id: { in: templateIds }
      },
      select: {
        id: true,
        name: true,
        category: true,
        status: true
      }
    });

    const templateMap = templates.reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {} as Record<string, any>);

    const usageData = templateUsage.map(t => ({
      template: templateMap[t.templateId!],
      usage: t._count.id
    }));

    // Get template status breakdown
    const allTemplates = await prisma.template.groupBy({
      by: ['status'],
      where: { userId: req.user!.id },
      _count: {
        id: true
      }
    });

    res.json({
      success: true,
      data: {
        usage: usageData,
        statusBreakdown: allTemplates
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
    const period = (req.query.period as string) || '30d';
    const { startDate, endDate } = getDateRange(period);

    // Get conversation stats
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: req.user!.id,
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    // Calculate average messages per conversation
    const totalMessages = conversations.reduce((sum, c) => sum + c._count.messages, 0);
    const avgMessagesPerConversation = conversations.length > 0 
      ? (totalMessages / conversations.length).toFixed(2)
      : '0';

    // Get response time (simplified - time between first inbound and first outbound)
    const conversationsWithResponseTime = await Promise.all(
      conversations.map(async (conv) => {
        const firstInbound = await prisma.message.findFirst({
          where: {
            conversationId: conv.id,
            direction: 'inbound'
          },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true }
        });

        const firstOutbound = await prisma.message.findFirst({
          where: {
            conversationId: conv.id,
            direction: 'outbound'
          },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true }
        });

        if (firstInbound && firstOutbound) {
          return {
            responseTime: new Date(firstOutbound.createdAt).getTime() - new Date(firstInbound.createdAt).getTime()
          };
        }
        return null;
      })
    );

    const validResponseTimes = conversationsWithResponseTime
      .filter((c): c is { responseTime: number } => c !== null)
      .map(c => c.responseTime);

    const avgResponseTime = validResponseTimes.length > 0
      ? (validResponseTimes.reduce((a, b) => a + b, 0) / validResponseTimes.length / 1000 / 60).toFixed(2)
      : '0';

    res.json({
      success: true,
      data: {
        totalConversations: conversations.length,
        avgMessagesPerConversation,
        avgResponseTimeMinutes: avgResponseTime,
        byStatus: {
          active: conversations.filter(c => c.status === 'active').length,
          archived: conversations.filter(c => c.status === 'archived').length
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

export default router;
