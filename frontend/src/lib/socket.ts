import { io, Socket } from 'socket.io-client'
import { getAuthToken } from './api'

export interface SocketMessage {
  id: string
  conversationId: string
  content: string
  direction: 'inbound' | 'outbound'
  createdAt: string
  status: string
  customer?: {
    id: string
    name: string
    phone: string
  }
}

export interface SocketEvents {
  // Connection events
  connect: () => void
  disconnect: () => void
  error: (error: any) => void

  // Message events
  message_received: (message: SocketMessage) => void
  message_status_updated: (data: {
    messageId: string
    status: string
  }) => void

  // Conversation events
  conversation_update: (data: {
    conversationId: string
    type: string
    [key: string]: any
  }) => void

  // Campaign events
  campaign_update: (data: {
    campaignId: string
    type: string
    [key: string]: any
  }) => void

  // Typing events
  user_typing: (data: {
    userId: string
    conversationId: string
  }) => void

  user_stop_typing: (data: {
    userId: string
    conversationId: string
  }) => void
}

class SocketClient {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private isConnected = false

  constructor() {
    this.connect()
  }

  private connect() {
    const token = getAuthToken()
    
    if (!token) {
      console.warn('No auth token found, cannot connect to WebSocket')
      return
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000'

    this.socket = io(wsUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.isConnected = true
      this.emit('connect')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      this.isConnected = false
      this.emit('disconnect', reason)

      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect()
        }
      }, 5000)
    })

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    })

    // Message events
    this.socket.on('message_received', (message: SocketMessage) => {
      this.emit('message_received', message)
    })

    this.socket.on('message_status_updated', (data) => {
      this.emit('message_status_updated', data)
    })

    // Conversation events
    this.socket.on('conversation_update', (data) => {
      this.emit('conversation_update', data)
    })

    // Campaign events
    this.socket.on('campaign_update', (data) => {
      this.emit('campaign_update', data)
    })

    // Typing events
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data)
    })

    this.socket.on('user_stop_typing', (data) => {
      this.emit('user_stop_typing', data)
    })
  }

  // Event listener management
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]) {
    if (!callback) {
      this.listeners.delete(event)
      return
    }
    
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  private emit(event: string, ...args: any[]) {
    const eventListeners = this.listeners.get(event as keyof SocketEvents)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error)
        }
      })
    }
  }

  // Socket actions
  joinConversation(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_conversation', conversationId)
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_conversation', conversationId)
    }
  }

  startTyping(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { conversationId })
    }
  }

  stopTyping(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { conversationId })
    }
  }

  // Connection status
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.listeners.clear()
    }
  }

  // Reconnect
  reconnect() {
    this.disconnect()
    setTimeout(() => {
      this.connect()
    }, 100)
  }
}

// Create singleton instance
const socketClient = new SocketClient()

export default socketClient

// Hook for React components
export function useSocket() {
  return socketClient
}