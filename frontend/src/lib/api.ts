import axios from 'axios'
import Cookies from 'js-cookie'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('auth-token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// API functions
export const authAPI = {
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (data: {
    firstName?: string
    lastName?: string
    email?: string
  }) => api.put('/auth/profile', data),

  changePassword: (data: {
    currentPassword: string
    newPassword: string
  }) => api.put('/auth/password', data),
}

export const customersAPI = {
  getAll: (params?: {
    page?: number
    limit?: number
    search?: string
    tagIds?: string[]
  }) => api.get('/customers', { params }),

  getById: (id: string) => api.get(`/customers/${id}`),

  create: (data: {
    name: string
    phone: string
    email?: string
    notes?: string
    tags?: string[]
  }) => api.post('/customers', data),

  update: (id: string, data: {
    name?: string
    phone?: string
    email?: string
    notes?: string
    tags?: string[]
  }) => api.put(`/customers/${id}`, data),

  delete: (id: string) => api.delete(`/customers/${id}`),
}

export const tagsAPI = {
  getAll: () => api.get('/tags'),

  create: (data: {
    name: string
    color?: string
    description?: string
  }) => api.post('/tags', data),

  update: (id: string, data: {
    name?: string
    color?: string
    description?: string
  }) => api.put(`/tags/${id}`, data),

  delete: (id: string) => api.delete(`/tags/${id}`),

  getCustomers: (id: string) => api.get(`/tags/${id}/customers`),
}

export const templatesAPI = {
  getAll: () => api.get('/templates'),

  getById: (id: string) => api.get(`/templates/${id}`),

  create: (data: {
    name: string
    category: 'marketing' | 'utility' | 'authentication'
    language?: string
    content: string
    variables?: string[]
  }) => api.post('/templates', data),

  update: (id: string, data: {
    name?: string
    category?: 'marketing' | 'utility' | 'authentication'
    language?: string
    content?: string
    variables?: string[]
  }) => api.put(`/templates/${id}`, data),

  delete: (id: string) => api.delete(`/templates/${id}`),

  sync: (id: string) => api.post(`/templates/${id}/sync`),

  preview: (id: string, variables: Record<string, string>) =>
    api.post(`/templates/${id}/preview`, { variables }),
}

export const campaignsAPI = {
  getAll: () => api.get('/campaigns'),

  getById: (id: string) => api.get(`/campaigns/${id}`),

  create: (data: {
    name: string
    description?: string
    templateId: string
    tagIds: string[]
    scheduledAt?: string
  }) => api.post('/campaigns', data),

  send: (id: string, data: { tagIds: string[] }) =>
    api.post(`/campaigns/${id}/send`, data),

  cancel: (id: string) => api.put(`/campaigns/${id}/cancel`),

  getAnalytics: (id: string) => api.get(`/campaigns/${id}/analytics`),
}

export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),

  getConversationMessages: (conversationId: string, params?: {
    page?: number
    limit?: number
  }) => api.get(`/messages/conversations/${conversationId}/messages`, { params }),

  send: (data: {
    conversationId: string
    content: string
    messageType?: 'text' | 'template'
    templateId?: string
    templateVariables?: Record<string, string>
  }) => api.post('/messages/send', data),

  markAsRead: (messageId: string) => api.put(`/messages/${messageId}/read`),

  archiveConversation: (conversationId: string) =>
    api.put(`/messages/conversations/${conversationId}/archive`),

  unarchiveConversation: (conversationId: string) =>
    api.put(`/messages/conversations/${conversationId}/unarchive`),

  getUnreadCount: () => api.get('/messages/unread-count'),

  search: (query: string, limit?: number) =>
    api.get('/messages/search', { params: { q: query, limit } }),
}

export const settingsAPI = {
  getWhatsApp: () => api.get('/settings/whatsapp'),

  updateWhatsApp: (data: {
    accessToken: string
    phoneNumberId: string
    businessId: string
    webhookVerifyToken?: string
  }) => api.post('/settings/whatsapp', data),

  deleteWhatsApp: () => api.delete('/settings/whatsapp'),

  testWhatsApp: () => api.post('/settings/whatsapp/test'),

  getProfile: () => api.get('/settings/profile'),

  updateProfile: (data: {
    firstName?: string
    lastName?: string
    email?: string
  }) => api.put('/settings/profile', data),

  changePassword: (data: {
    currentPassword: string
    newPassword: string
  }) => api.put('/settings/password', data),
}

export const analyticsAPI = {
  getOverview: (period?: string) =>
    api.get('/analytics/overview', { params: { period } }),

  getMessages: (period?: string, groupBy?: string) =>
    api.get('/analytics/messages', { params: { period, groupBy } }),

  getCampaigns: (period?: string) =>
    api.get('/analytics/campaigns', { params: { period } }),

  getCustomers: (period?: string) =>
    api.get('/analytics/customers', { params: { period } }),

  getTemplates: (period?: string) =>
    api.get('/analytics/templates', { params: { period } }),

  getConversations: (period?: string) =>
    api.get('/analytics/conversations', { params: { period } }),
}

// WebSocket events
export const websocketEvents = {
  NEW_MESSAGE: 'new_message',
  MESSAGE_STATUS_UPDATED: 'message_status_updated',
  CONVERSATION_UPDATED: 'conversation_update',
  CAMPAIGN_UPDATE: 'campaign_update',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
}

// Helper functions
export const setAuthToken = (token: string) => {
  Cookies.set('auth-token', token, {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}

export const removeAuthToken = () => {
  Cookies.remove('auth-token')
}

export const getAuthToken = (): string | undefined => {
  return Cookies.get('auth-token')
}

export const isAuthenticated = (): boolean => {
  return !!getAuthToken()
}

export default api