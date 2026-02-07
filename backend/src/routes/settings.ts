import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { updateWhatsAppCredentialsSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';
import { EncryptionService } from '../services/encryption';
import { WhatsAppService } from '../services/whatsapp';

const router = Router();

// Get user profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Check if email is already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: req.user!.id }
        }
      });

      if (existingUser) {
        throw createError('Email is already in use', 400);
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Change password
router.put('/password', async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw createError('Current password and new password are required', 400);
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const bcrypt = await import('bcryptjs');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw createError('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get WhatsApp credentials
router.get('/whatsapp', async (req: AuthRequest, res: Response) => {
  try {
    const credentials = await prisma.whatsAppCredentials.findUnique({
      where: { userId: req.user!.id }
    });

    if (!credentials) {
      return res.json({
        success: true,
        data: null
      });
    }

    // Return credentials without sensitive data
    res.json({
      success: true,
      data: {
        id: credentials.id,
        phoneNumberId: credentials.phoneNumberId,
        businessId: credentials.businessId,
        phoneNumber: credentials.phoneNumber,
        displayName: credentials.displayName,
        qualityRating: credentials.qualityRating,
        messagingLimit: credentials.messagingLimit,
        isActive: credentials.isActive,
        lastVerifiedAt: credentials.lastVerifiedAt,
        createdAt: credentials.createdAt,
        updatedAt: credentials.updatedAt
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Update WhatsApp credentials
router.post('/whatsapp', async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = updateWhatsAppCredentialsSchema.parse(req.body);

    // Encrypt access token
    const encryptedToken = EncryptionService.encrypt(validatedData.accessToken);

    // Test the credentials
    const whatsappService = new WhatsAppService();
    const testResult = await whatsappService.sendTextMessage(
      req.user!.id,
      '+1234567890', // Test number
      'Test message'
    );

    // If test fails with credentials error, don't save
    if (!testResult.success && testResult.error?.includes('credentials')) {
      throw createError('Invalid WhatsApp credentials', 400);
    }

    // Upsert credentials
    const credentials = await prisma.whatsAppCredentials.upsert({
      where: { userId: req.user!.id },
      update: {
        accessToken: encryptedToken,
        phoneNumberId: validatedData.phoneNumberId,
        businessId: validatedData.businessId,
        webhookVerifyToken: validatedData.webhookVerifyToken,
        isActive: true,
        lastVerifiedAt: new Date()
      },
      create: {
        userId: req.user!.id,
        accessToken: encryptedToken,
        phoneNumberId: validatedData.phoneNumberId,
        businessId: validatedData.businessId,
        webhookVerifyToken: validatedData.webhookVerifyToken,
        isActive: true,
        lastVerifiedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'WhatsApp credentials saved successfully',
      data: {
        id: credentials.id,
        phoneNumberId: credentials.phoneNumberId,
        businessId: credentials.businessId,
        isActive: credentials.isActive,
        lastVerifiedAt: credentials.lastVerifiedAt
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete WhatsApp credentials
router.delete('/whatsapp', async (req: AuthRequest, res: Response) => {
  try {
    const credentials = await prisma.whatsAppCredentials.findUnique({
      where: { userId: req.user!.id }
    });

    if (!credentials) {
      throw createError('WhatsApp credentials not found', 404);
    }

    await prisma.whatsAppCredentials.delete({
      where: { userId: req.user!.id }
    });

    res.json({
      success: true,
      message: 'WhatsApp credentials removed successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Test WhatsApp connection
router.post('/whatsapp/test', async (req: AuthRequest, res: Response) => {
  try {
    const credentials = await prisma.whatsAppCredentials.findUnique({
      where: { userId: req.user!.id }
    });

    if (!credentials) {
      throw createError('WhatsApp credentials not configured', 400);
    }

    const whatsappService = new WhatsAppService();
    
    // Get phone number info from WhatsApp API
    const decryptedToken = EncryptionService.decrypt(credentials.accessToken);
    
    // Test by getting phone number info
    const axios = await import('axios');
    const response = await axios.default.get(
      `https://graph.facebook.com/v17.0/${credentials.phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${decryptedToken}`
        }
      }
    );

    // Update credentials with latest info
    await prisma.whatsAppCredentials.update({
      where: { userId: req.user!.id },
      data: {
        phoneNumber: response.data.display_phone_number,
        displayName: response.data.verified_name,
        qualityRating: response.data.quality_rating,
        lastVerifiedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'WhatsApp connection test successful',
      data: {
        phoneNumber: response.data.display_phone_number,
        displayName: response.data.verified_name,
        qualityRating: response.data.quality_rating
      }
    });
  } catch (error: any) {
    console.error('WhatsApp test error:', error.response?.data || error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message || 'Connection test failed'
    });
  }
});

// Get account stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalCustomers,
      totalConversations,
      totalMessages,
      totalTemplates,
      totalCampaigns,
      totalTags,
      whatsappCredentials
    ] = await Promise.all([
      prisma.customer.count({ where: { userId: req.user!.id } }),
      prisma.conversation.count({ where: { userId: req.user!.id } }),
      prisma.message.count({ where: { userId: req.user!.id } }),
      prisma.template.count({ where: { userId: req.user!.id } }),
      prisma.campaign.count({ where: { userId: req.user!.id } }),
      prisma.tag.count({ where: { userId: req.user!.id } }),
      prisma.whatsAppCredentials.findUnique({
        where: { userId: req.user!.id },
        select: { isActive: true, lastVerifiedAt: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        customers: totalCustomers,
        conversations: totalConversations,
        messages: totalMessages,
        templates: totalTemplates,
        campaigns: totalCampaigns,
        tags: totalTags,
        whatsappConnected: whatsappCredentials?.isActive || false,
        lastVerifiedAt: whatsappCredentials?.lastVerifiedAt
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
