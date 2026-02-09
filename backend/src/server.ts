import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import tagRoutes from './routes/tags';
import templateRoutes from './routes/templates';
import campaignRoutes from './routes/campaigns';
import messageRoutes from './routes/messages';
import settingsRoutes from './routes/settings';
import webhookRoutes from './routes/webhooks';
import analyticsRoutes from './routes/analytics';
import inboxRoutes from './routes/inbox';
import auditLogRoutes from './routes/auditLogs';
import monitoringRoutes from './routes/monitoring';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import { httpRequestDuration, httpRequestTotal } from './routes/monitoring';

// Import services
import { initializeSocket } from './services/socket';
import { initializeRedis } from './services/redis';
import logger from './services/logger';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });
  
  next();
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/customers', authenticateToken, customerRoutes);
app.use('/tags', authenticateToken, tagRoutes);
app.use('/templates', authenticateToken, templateRoutes);
app.use('/campaigns', authenticateToken, campaignRoutes);
app.use('/messages', authenticateToken, messageRoutes);
app.use('/inbox', authenticateToken, inboxRoutes);
app.use('/settings', authenticateToken, settingsRoutes);
app.use('/webhooks', webhookRoutes); // No auth for webhooks
app.use('/analytics', authenticateToken, analyticsRoutes);
app.use('/audit-logs', authenticateToken, auditLogRoutes);
app.use('/monitoring', monitoringRoutes);

// Initialize services
const initializeServices = async () => {
  try {
    await initializeRedis();
    initializeSocket(io);
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services', { error });
  }
};

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  logger.info(`🚀 Reachly Backend running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  await initializeServices();
});

export { io };
export default app;