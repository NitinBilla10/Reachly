import { z } from 'zod';

// Customer Schemas
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  profileImage: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  companyName: z.string().optional(),
  source: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  contactTypeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  optIn: z.boolean().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  profileImage: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  companyName: z.string().optional(),
  source: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  contactTypeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  optIn: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  followUpStatus: z.enum(['follow-up', 'spam', 'unread', 'none']).optional(),
});

export const customerFilterSchema = z.object({
  contactTypeIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  optIn: z.boolean().optional(),
  source: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'name', 'lastMessageAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Contact Type Schemas
export const createContactTypeSchema = z.object({
  name: z.string().min(1, 'Contact type name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  description: z.string().optional(),
});

export const updateContactTypeSchema = z.object({
  name: z.string().min(1, 'Contact type name is required').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  description: z.string().optional(),
});

// Tag Schemas
export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  description: z.string().optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  description: z.string().optional(),
});

// Template Schemas
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  category: z.enum(['marketing', 'utility', 'authentication']),
  language: z.string().default('en_US'),
  content: z.string().min(1, 'Template content is required'),
  header: z.string().optional(),
  headerType: z.enum(['text', 'image', 'video', 'document']).optional(),
  footer: z.string().optional(),
  buttons: z.array(z.object({
    type: z.string(),
    text: z.string(),
  })).optional(),
  variables: z.array(z.string()).optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').optional(),
  category: z.enum(['marketing', 'utility', 'authentication']).optional(),
  language: z.string().optional(),
  content: z.string().min(1, 'Template content is required').optional(),
  header: z.string().optional(),
  headerType: z.enum(['text', 'image', 'video', 'document']).optional(),
  footer: z.string().optional(),
  buttons: z.array(z.object({
    type: z.string(),
    text: z.string(),
  })).optional(),
  variables: z.array(z.string()).optional(),
});

// Quick Reply Schemas
export const createQuickReplySchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  response: z.string().min(1, 'Response is required'),
  mediaUrl: z.string().optional(),
  matchType: z.enum(['exact', 'contains', 'starts_with']).default('contains'),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateQuickReplySchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').optional(),
  response: z.string().min(1, 'Response is required').optional(),
  mediaUrl: z.string().optional(),
  matchType: z.enum(['exact', 'contains', 'starts_with']).optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Campaign Schemas
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  templateId: z.string().min(1, 'Template is required'),
  tagIds: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'paused', 'cancelled']).optional(),
  scheduledAt: z.string().datetime().optional(),
});

// Message Schemas
export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message content is required'),
  messageType: z.enum(['text', 'template', 'image', 'video', 'document']).default('text'),
  templateId: z.string().optional(),
  templateVariables: z.record(z.string()).optional(),
  mediaUrl: z.string().optional(),
  mediaCaption: z.string().optional(),
});

export const sendBulkMessageSchema = z.object({
  customerIds: z.array(z.string()).min(1, 'At least one customer is required'),
  content: z.string().min(1, 'Message content is required'),
  messageType: z.enum(['text', 'template']).default('text'),
  templateId: z.string().optional(),
  templateVariables: z.record(z.string()).optional(),
});

// WhatsApp Credentials Schemas
export const updateWhatsAppCredentialsSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  phoneNumberId: z.string().min(1, 'Phone number ID is required'),
  businessId: z.string().min(1, 'Business ID is required'),
  webhookVerifyToken: z.string().optional(),
});

// Import Schemas
export const createImportSchema = z.object({
  fileType: z.enum(['csv', 'xlsx']),
  columnMapping: z.record(z.string()),
  duplicateStrategy: z.enum(['skip', 'update', 'error']).default('skip'),
});

// Workspace Schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only'),
  description: z.string().optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').optional(),
  description: z.string().optional(),
});

export const addWorkspaceMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'member']).default('member'),
});

// Analytics Schemas
export const analyticsPeriodSchema = z.object({
  period: z.enum(['24h', '7d', '30d', '90d', '1y']).default('30d'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Types
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerFilterInput = z.infer<typeof customerFilterSchema>;
export type CreateContactTypeInput = z.infer<typeof createContactTypeSchema>;
export type UpdateContactTypeInput = z.infer<typeof updateContactTypeSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type CreateQuickReplyInput = z.infer<typeof createQuickReplySchema>;
export type UpdateQuickReplyInput = z.infer<typeof updateQuickReplySchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SendBulkMessageInput = z.infer<typeof sendBulkMessageSchema>;
export type UpdateWhatsAppCredentialsInput = z.infer<typeof updateWhatsAppCredentialsSchema>;
export type CreateImportInput = z.infer<typeof createImportSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
export type AnalyticsPeriodInput = z.infer<typeof analyticsPeriodSchema>;
