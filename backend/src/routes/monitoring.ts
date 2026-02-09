import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MetricsService } from '../services/metrics';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

const router = Router();

// Initialize Prometheus metrics
collectDefaultMetrics();

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const messagesSentTotal = new Counter({
  name: 'messages_sent_total',
  help: 'Total number of messages sent',
  labelNames: ['direction', 'status']
});

export const campaignsTotal = new Counter({
  name: 'campaigns_total',
  help: 'Total number of campaigns',
  labelNames: ['status']
});

// Prometheus metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Get dashboard metrics
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30d' } = req.query;

    const metrics = await MetricsService.getDashboardMetrics(req.user!.id, period as string);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get messages per hour
router.get('/messages-per-hour', async (req: AuthRequest, res: Response) => {
  try {
    const { hours = '24' } = req.query;

    const metrics = await MetricsService.getMessagesPerHour(parseInt(hours as string));

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get system health
router.get('/health', async (req: AuthRequest, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
