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
import contactTypeRoutes from './routes/contactTypes';
import tagRoutes from './routes/tags';
import templateRoutes from './routes/templates';
import campaignRoutes from './routes/campaigns';
import messageRoutes from './routes/messages';
import settingsRoutes from './routes/settings';
import webhookRoutes from './routes/webhooks';
import analyticsRoutes from './routes/analytics';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

// Import services
import { initializeSocket } from './services/socket';

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
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
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
app.use('/contact-types', authenticateToken, contactTypeRoutes);
app.use('/tags', authenticateToken, tagRoutes);
app.use('/templates', authenticateToken, templateRoutes);
app.use('/campaigns', authenticateToken, campaignRoutes);
app.use('/messages', authenticateToken, messageRoutes);
app.use('/settings', authenticateToken, settingsRoutes);
app.use('/webhooks', webhookRoutes); // No auth for webhooks
app.use('/analytics', authenticateToken, analyticsRoutes);

// Initialize Socket.IO
initializeSocket(io);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Reachly Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };
export default app;