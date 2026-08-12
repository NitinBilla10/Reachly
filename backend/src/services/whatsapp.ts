import axios from 'axios';
import { prisma } from './database';
import { EncryptionService } from './encryption';

export interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: string;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

export interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
  businessId: string;
  webhookVerifyToken?: string;
}

export class WhatsAppService {
  private baseURL = `${process.env.WHATSAPP_BASE_URL || 'https://graph.facebook.com'}/${process.env.WHATSAPP_API_VERSION || 'v26.0'}`;

  async getCredentials(userId: string): Promise<WhatsAppCredentials | null> {
    const credentials = await prisma.whatsAppCredentials.findUnique({
      where: { userId }
    });

    if (!credentials) return null;

    return {
      accessToken: EncryptionService.decrypt(credentials.accessToken),
      phoneNumberId: credentials.phoneNumberId,
      businessId: credentials.businessId,
      webhookVerifyToken: credentials.webhookVerifyToken || undefined
    };
  }

  async sendTextMessage(
    userId: string,
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const credentials = await this.getCredentials(userId);
      if (!credentials) {
        return { success: false, error: 'WhatsApp credentials not found' };
      }

      const formattedTo = to.replace(/\D/g, '');

      const payload: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: formattedTo,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${credentials.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error: any) {
      console.error('WhatsApp API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async sendTemplateMessage(
    userId: string,
    to: string,
    templateName: string,
    language: string = 'en_US',
    parameters: Array<{ type: string; text: string }> = []
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const credentials = await this.getCredentials(userId);
      if (!credentials) {
        return { success: false, error: 'WhatsApp credentials not found' };
      }

      const formattedTemplateName = templateName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      const formattedTo = to.replace(/\D/g, '');

      const payload: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: formattedTo,
        type: 'template',
        template: {
          name: formattedTemplateName,
          language: {
            code: language
          },
          components: parameters.length > 0 ? [
            {
              type: 'body',
              parameters
            }
          ] : undefined
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${credentials.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error: any) {
      console.error('WhatsApp Template API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async getMessageStatus(
    userId: string,
    messageId: string
  ): Promise<{ status: string; error?: string }> {
    try {
      const credentials = await this.getCredentials(userId);
      if (!credentials) {
        return { status: 'failed', error: 'WhatsApp credentials not found' };
      }

      const response = await axios.get(
        `${this.baseURL}/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`
          }
        }
      );

      return { status: response.data.status };
    } catch (error: any) {
      console.error('WhatsApp Status API Error:', error.response?.data || error.message);
      return {
        status: 'failed',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async verifyWebhook(token: string, challenge: string): Promise<{ success: boolean; challenge?: string; error?: string }> {
    // Verify the webhook with WhatsApp's verify token
    if (token === process.env.WEBHOOK_VERIFY_TOKEN) {
      return { success: true, challenge };
    }

    return { success: false, error: 'Invalid verification token' };
  }

  async createMessageTemplate(
    userId: string,
    name: string,
    category: string,
    language: string,
    content: string
  ): Promise<{ success: boolean; templateId?: string; status?: string; error?: string }> {
    try {
      const credentials = await this.getCredentials(userId);
      if (!credentials) {
        return { success: false, error: 'WhatsApp credentials not found' };
      }

      const formattedTemplateName = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      const payload = {
        name: formattedTemplateName,
        language,
        category: category.toUpperCase(),
        components: [
          {
            type: 'BODY',
            text: content
          }
        ]
      };

      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${credentials.businessId}/message_templates`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { 
        success: true, 
        templateId: response.data.id,
        status: response.data.status || 'PENDING'
      };
    } catch (error: any) {
      console.error('WhatsApp Template Creation Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.error_user_msg || error.response?.data?.error?.message || error.message
      };
    }
  }
}