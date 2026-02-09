import { prisma } from './database';
import logger from './logger';

interface AuditLogData {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogService {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          ...data,
          oldValue: data.oldValue || null,
          newValue: data.newValue || null,
          metadata: data.metadata || null
        }
      });

      logger.info('Audit log created', { 
        action: data.action, 
        userId: data.userId,
        entityType: data.entityType 
      });
    } catch (error) {
      logger.error('Failed to create audit log', { error, data });
    }
  }

  static async logCampaignCreated(userId: string, campaignId: string, campaignData: any, req?: any): Promise<void> {
    await this.log({
      userId,
      action: 'campaign_created',
      entityType: 'campaign',
      entityId: campaignId,
      newValue: campaignData,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  static async logCampaignSent(userId: string, campaignId: string, metadata: any, req?: any): Promise<void> {
    await this.log({
      userId,
      action: 'campaign_sent',
      entityType: 'campaign',
      entityId: campaignId,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  static async logCampaignCancelled(userId: string, campaignId: string, reason?: string, req?: any): Promise<void> {
    await this.log({
      userId,
      action: 'campaign_cancelled',
      entityType: 'campaign',
      entityId: campaignId,
      metadata: { reason },
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  static async logCustomerDeleted(userId: string, customerId: string, customerData: any, req?: any): Promise<void> {
    await this.log({
      userId,
      action: 'customer_deleted',
      entityType: 'customer',
      entityId: customerId,
      oldValue: customerData,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  static async logSettingsUpdated(userId: string, oldSettings: any, newSettings: any, req?: any): Promise<void> {
    await this.log({
      userId,
      action: 'settings_updated',
      entityType: 'settings',
      oldValue: oldSettings,
      newValue: newSettings,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  static async logPermissionChange(userId: string, targetUserId: string, changes: any, req?: any): Promise<void> {
    await this.log({
      userId,
      action: 'permission_changed',
      entityType: 'user',
      entityId: targetUserId,
      newValue: changes,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  }

  static async getAuditLogs(filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const { limit = 50, offset = 0, ...whereFilters } = filters;

    const where: any = {};
    if (whereFilters.userId) where.userId = whereFilters.userId;
    if (whereFilters.entityType) where.entityType = whereFilters.entityType;
    if (whereFilters.entityId) where.entityId = whereFilters.entityId;
    if (whereFilters.action) where.action = whereFilters.action;
    if (whereFilters.startDate || whereFilters.endDate) {
      where.createdAt = {};
      if (whereFilters.startDate) where.createdAt.gte = whereFilters.startDate;
      if (whereFilters.endDate) where.createdAt.lte = whereFilters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.auditLog.count({ where })
    ]);

    return { logs, total, limit, offset };
  }
}
