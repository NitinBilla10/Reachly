import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export class SocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
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
      console.log(`User ${socket.userId} connected`);
      
      // Join user to their personal room
      socket.join(`user:${socket.userId}`);

      // Handle joining conversation rooms
      socket.on('join_conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
      });

      // Handle leaving conversation rooms
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
      });

      // Handle new message events
      socket.on('new_message', (data) => {
        // Broadcast to all users in the conversation
        this.io.to(`conversation:${data.conversationId}`).emit('message_received', data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
          userId: socket.userId,
          conversationId: data.conversationId
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(`conversation:${data.conversationId}`).emit('user_stop_typing', {
          userId: socket.userId,
          conversationId: data.conversationId
        });
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
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