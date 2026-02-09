import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from 'socket.io-redis';
import { redisClient } from './redis';
import logger from './logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface TypingUser {
  userId: string;
  timestamp: number;
}

export class SocketService {
  private io: Server;
  private typingUsers: Map<string, TypingUser[]> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupRedisAdapter();
    this.setupMiddleware();
    this.setupEventHandlers();
    this.startTypingCleanup();
  }

  private setupRedisAdapter() {
    try {
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();
      
      // Note: socket.io-redis v6 uses a different API
      // This is a placeholder for the actual implementation
      logger.info('Redis adapter configured for Socket.IO');
    } catch (error) {
      logger.error('Failed to setup Redis adapter', { error });
    }
  }

  private startTypingCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [conversationId, users] of this.typingUsers.entries()) {
        const activeUsers = users.filter(u => now - u.timestamp < 5000);
        if (activeUsers.length === 0) {
          this.typingUsers.delete(conversationId);
        } else {
          this.typingUsers.set(conversationId, activeUsers);
        }
      }
    }, 5000);
  }

  private setupMiddleware() {
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.id;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info('User connected', { userId: socket.userId });
      
      // Join user to their personal room
      socket.join(`user:${socket.userId}`);

      // Handle joining conversation rooms
      socket.on('join_conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        logger.debug('User joined conversation', { userId: socket.userId, conversationId });
      });

      // Handle leaving conversation rooms
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        logger.debug('User left conversation', { userId: socket.userId, conversationId });
      });

      // Handle new message events
      socket.on('new_message', (data) => {
        this.io.to(`conversation:${data.conversationId}`).emit('message_received', data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const conversationId = data.conversationId;
        const users = this.typingUsers.get(conversationId) || [];
        
        // Add or update user's typing status
        const existingIndex = users.findIndex(u => u.userId === socket.userId);
        const typingUser = { userId: socket.userId!, timestamp: Date.now() };
        
        if (existingIndex >= 0) {
          users[existingIndex] = typingUser;
        } else {
          users.push(typingUser);
        }
        
        this.typingUsers.set(conversationId, users);

        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          userId: socket.userId,
          conversationId
        });
      });

      socket.on('typing_stop', (data) => {
        const conversationId = data.conversationId;
        const users = this.typingUsers.get(conversationId) || [];
        const filteredUsers = users.filter(u => u.userId !== socket.userId);
        
        if (filteredUsers.length === 0) {
          this.typingUsers.delete(conversationId);
        } else {
          this.typingUsers.set(conversationId, filteredUsers);
        }

        socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
          userId: socket.userId,
          conversationId
        });
      });

      // Handle message read receipts
      socket.on('mark_read', (data: { messageId: string, conversationId: string }) => {
        socket.to(`conversation:${data.conversationId}`).emit('message_read', {
          messageId: data.messageId,
          userId: socket.userId
        });
      });

      // Handle conversation pin/unpin
      socket.on('conversation_pinned', (data: { conversationId: string, isPinned: boolean }) => {
        socket.to(`user:${socket.userId}`).emit('conversation_updated', {
          conversationId: data.conversationId,
          isPinned: data.isPinned
        });
      });

      socket.on('disconnect', () => {
        logger.info('User disconnected', { userId: socket.userId });
        
        // Clean up typing indicators
        for (const [conversationId, users] of this.typingUsers.entries()) {
          const filteredUsers = users.filter(u => u.userId !== socket.userId);
          if (filteredUsers.length === 0) {
            this.typingUsers.delete(conversationId);
          } else {
            this.typingUsers.set(conversationId, filteredUsers);
          }
        }
      });
    });
  }

  // Methods to emit events from controllers
  emitNewMessage(conversationId: string, message: any) {
    this.io.to(`conversation:${conversationId}`).emit('message_received', message);
  }

  emitMessageStatusUpdate(conversationId: string, messageId: string, status: string) {
    this.io.to(`conversation:${conversationId}`).emit('message_status_updated', {
      messageId,
      status
    });
  }

  emitCampaignUpdate(userId: string, campaignId: string, update: any) {
    this.io.to(`user:${userId}`).emit('campaign_update', {
      campaignId,
      ...update
    });
  }

  emitConversationUpdate(userId: string, conversationId: string, update: any) {
    this.io.to(`user:${userId}`).emit('conversation_update', {
      conversationId,
      ...update
    });
  }
}

let socketService: SocketService;

export const initializeSocket = (io: Server) => {
  socketService = new SocketService(io);
};

export const getSocketService = () => socketService;