import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuditLogService } from '../services/auditLog';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const filters: any = {
      userId: req.user!.id,
      limit: limitNum,
      offset
    };

    if (entityType) filters.entityType = entityType as string;
    if (entityId) filters.entityId = entityId as string;
    if (action) filters.action = action as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const result = await AuditLogService.getAuditLogs(filters);

    res.json({
      success: true,
      data: {
        logs: result.logs,
        pagination: {
          total: result.total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(result.total / limitNum)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
