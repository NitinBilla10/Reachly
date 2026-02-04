import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  description: z.string().optional()
});

export const updateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  description: z.string().optional()
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  category: z.enum(['marketing', 'utility', 'authentication']),
  language: z.string().default('en_US'),
  content: z.string().min(1, 'Template content is required'),
  variables: z.array(z.string()).optional()
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').optional(),
  category: z.enum(['marketing', 'utility', 'authentication']).optional(),
  language: z.string().optional(),
  content: z.string().min(1, 'Template content is required').optional(),
  variables: z.array(z.string()).optional()
});

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  templateId: z.string().min(1, 'Template is required'),
  tagIds: z.array(z.string()).min(1, 'At least one tag is required'),
  scheduledAt: z.string().datetime().optional()
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message content is required'),
  messageType: z.enum(['text', 'template']).default('text'),
  templateId: z.string().optional(),
  templateVariables: z.record(z.string()).optional()
});

export const updateWhatsAppCredentialsSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  phoneNumberId: z.string().min(1, 'Phone number ID is required'),
  businessId: z.string().min(1, 'Business ID is required'),
  webhookVerifyToken: z.string().optional()
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateWhatsAppCredentialsInput = z.infer<typeof updateWhatsAppCredentialsSchema>;