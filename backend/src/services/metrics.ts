import { prisma } from './database';
import { redisClient } from './redis';
import logger from './logger';

export class MetricsService {
  static async recordMetric(metricType: string, value: number, metadata?: any): Promise<void> {
    try {
      await prisma.systemMetric.create({
        data: {
          metricType,
          value,
          metadata: metadata || null,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to record metric', { error, metricType, value });
    }
  }

  static async recordApiResponseTime(endpoint: string, duration: number): Promise<void> {
    await this.recordMetric('api_response_time', duration, { endpoint });
  }

  static async recordMessageSent(direction: 'inbound' | 'outbound'): Promise<void> {
    const hour = new Date().toISOString().slice(0, 13);
    const key = `messages:${direction}:${hour}`;
    
    try {
      await redisClient.incr(key);
      await redisClient.expire(key, 86400); // 24 hours
    } catch (error) {
      logger.error('Failed to record message metric', { error, direction });
    }
  }

  static async recordCampaignThroughput(campaignId: string, messagesPerMinute: number): Promise<void> {
    await this.recordMetric('campaign_throughput', messagesPerMinute, { campaignId });
  }

  static async recordActiveUsers(): Promise<void> {
    try {
      const activeUsers = await prisma.user.count({
        where: {
          conversations: {
            some: {
              updatedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      });

      await this.recordMetric('active_users_24h', activeUsers);
    } catch (error) {
      logger.error('Failed to record active users metric', { error });
    }
  }

  static async getMetrics(metricType: string, startDate: Date, endDate: Date) {
    return prisma.systemMetric.findMany({
      where: {
        metricType,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { timestamp: 'asc' }
    });
  }

  static async getMessagesPerHour(hours: number = 24) {
    const metrics: { [key: string]: number } = {};
    const now = new Date();

    for (let i = 0; i < hours; i++) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000).toISOString().slice(0, 13);
      
      try {
        const inbound = await redisClient.get(`messages:inbound:${hour}`);
        const outbound = await redisClient.get(`messages:outbound:${hour}`);
        
        metrics[hour] = {
          inbound: parseInt(inbound || '0'),
          outbound: parseInt(outbound || '0'),
          total: parseInt(inbound || '0') + parseInt(outbound || '0')
        } as any;
      } catch (error) {
        logger.error('Failed to get messages per hour', { error, hour });
      }
    }

    return metrics;
  }

  static async getDashboardMetrics(userId: string, period: string = '30d') {
    const startDate = this.getStartDate(period);
    const now = new Date();

    const [
      totalMessages,
      sentMessages,
      deliveredMessages,
      readMessages,
      failedMessages,
      campaignStats,
      avgResponseTime
    ] = await Promise.all([
      prisma.message.count({
        where: {
          conversation: { userId },
          sentAt: { gte: startDate }
        }
      }),
      prisma.message.count({
        where: {
          conversation: { userId },
          direction: 'outbound',
          sentAt: { gte: startDate }
        }
      }),
      prisma.message.count({
        where: {
          conversation: { userId },
          direction: 'outbound',
          status: 'delivered',
          sentAt: { gte: startDate }
        }
      }),
      prisma.message.count({
        where: {
          conversation: { userId },
          direction: 'outbound',
          status: 'read',
          sentAt: { gte: startDate }
        }
      }),
      prisma.message.count({
        where: {
          conversation: { userId },
          direction: 'outbound',
          status: 'failed',
          sentAt: { gte: startDate }
        }
      }),
      prisma.campaign.groupBy({
        by: ['status'],
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        _count: { status: true }
      }),
      this.calculateAvgResponseTime(userId, startDate, now)
    ]);

    const deliveryRate = sentMessages > 0 ? (deliveredMessages / sentMessages * 100).toFixed(2) : 0;
    const openRate = sentMessages > 0 ? (readMessages / sentMessages * 100).toFixed(2) : 0;

    return {
      messages: {
        total: totalMessages,
        sent: sentMessages,
        delivered: deliveredMessages,
        read: readMessages,
        failed: failedMessages,
        deliveryRate: parseFloat(deliveryRate as string),
        openRate: parseFloat(openRate as string)
      },
      campaigns: campaignStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as any),
      avgResponseTime
    };
  }

  private static async calculateAvgResponseTime(userId: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (m_outbound."sentAt" - m_inbound."sentAt"))/60) as avg_response_minutes
        FROM "conversations" c
        JOIN "messages" m_inbound ON c.id = m_inbound."conversationId" 
          AND m_inbound.direction = 'inbound'
        JOIN "messages" m_outbound ON c.id = m_outbound."conversationId" 
          AND m_outbound.direction = 'outbound'
        WHERE c."userId" = ${userId}
          AND m_inbound."sentAt" >= ${startDate}
          AND m_inbound."sentAt" <= ${endDate}
          AND m_outbound."sentAt" > m_inbound."sentAt"
          AND m_outbound."sentAt" <= m_inbound."sentAt" + INTERVAL '24 hours'
      `;

      return result[0]?.avg_response_minutes ? Math.round(result[0].avg_response_minutes) : 0;
    } catch (error) {
      logger.error('Failed to calculate avg response time', { error });
      return 0;
    }
  }

  private static getStartDate(period: string): Date {
    const now = new Date();
    
    switch (period) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
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
}
