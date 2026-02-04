import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { updateWhatsAppCredentialsSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';
import { EncryptionService } from '../services/encryption';
import { WhatsAppService } from '../services/whatsapp';

const router = Router();

// Get WhatsApp credentials
router.get('/whatsapp', async (req: AuthRequest, res: Response) => {
  try {
    const credentials = await prisma.whatsAppCredentials.findUnique({
      where: {
        userId: req.user!.id
      },
      select: {
        id: true,
        phoneNumberId: true,
        businessId: true,
        isActive: true,
        webhookVerifyToken: true,
        createdAt: true,
        updatedAt: true
        // Note: accessToken is intentionally excluded from response
      }
    });

    if (!credentials) {
      return res.json({
        success: true,
        data: null,
        message: 'No WhatsApp credentials configured'
      });
    }

    res.json({
      success: true,
      data: credentials
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

    // Encrypt the access token
    const encryptedAccessToken = EncryptionService.encrypt(validatedData.accessToken);

    // Test the credentials by making a simple API call
    const whatsappService = new WhatsAppService();
    
    // Temporarily set credentials for testing
    const testCredentials = {
      accessToken: validatedData.accessToken,
      phoneNumberId: validatedData.phoneNumberId,
      businessId: validatedData.businessId,
      webhookVerifyToken: validatedData.webhookVerifyToken
    };

    // Test connection (this would normally make a real API call)
    const isValidConnection = await testWhatsAppConnection(testCredentials);

    if (!isValidConnection) {
      throw createError('Invalid WhatsApp credentials. Please verify your access token and phone number ID.', 400);
    }

    // Upsert credentials
    const credentials = await prisma.whatsAppCredentials.upsert({
      where: {
        userId: req.user!.id
      },
      update: {
        accessToken: encryptedAccessToken,
        phoneNumberId: validatedData.phoneNumberId,
        businessId: validatedData.businessId,
        webhookVerifyToken: validatedData.webhookVerifyToken,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        userId: req.user!.id,
        accessToken: encryptedAccessToken,
        phoneNumberId: validatedData.phoneNumberId,
        businessId: validatedData.businessId,
        webhookVerifyToken: validatedData.webhookVerifyToken,
        isActive: true
      },
      select: {
        id: true,
        phoneNumberId: true,
        businessId: true,
        isActive: true,
        webhookVerifyToken: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'WhatsApp credentials updated successfully',
      data: credentials
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
      where: {
        userId: req.user!.id
      }
    });

    if (!credentials) {
      throw createError('WhatsApp credentials not found', 404);
    }

    await prisma.whatsAppCredentials.delete({
      where: {
        userId: req.user!.id
      }
    });

    res.json({
      success: true,
      message: 'WhatsApp credentials deleted successfully'
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
      where: {
        userId: req.user!.id
      }
    });

    if (!credentials) {
      throw createError('WhatsApp credentials not found', 404);
    }

    const isValidConnection = await testWhatsAppConnection({
      accessToken: EncryptionService.decrypt(credentials.accessToken),
      phoneNumberId: credentials.phoneNumberId,
      businessId: credentials.businessId,
      webhookVerifyToken: credentials.webhookVerifyToken || undefined
    });

    if (isValidConnection) {
      // Update last tested timestamp
      await prisma.whatsAppCredentials.update({
        where: {
          userId: req.user!.id
        },
        data: {
          updatedAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: isValidConnection ? 'Connection test successful' : 'Connection test failed',
      data: {
        isValid: isValidConnection
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Get account statistics
    const stats = await Promise.all([
      prisma.customer.count({ where: { userId: req.user!.id } }),
      prisma.tag.count({ where: { userId: req.user!.id } }),
      prisma.template.count({ where: { userId: req.user!.id } }),
      prisma.campaign.count({ where: { userId: req.user!.id } }),
      prisma.conversation.count({ where: { userId: req.user!.id } })
    ]);

    const [customerCount, tagCount, templateCount, campaignCount, conversationCount] = stats;

    res.json({
      success: true,
      data: {
        user,
        stats: {
          customers: customerCount,
          tags: tagCount,
          templates: templateCount,
          campaigns: campaignCount,
          conversations: conversationCount
        }
      }
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

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: req.user!.id }
        }
      });

      if (existingUser) {
        throw createError('Email is already taken', 400);
      }
    }

    const user = await prisma.user.update({
      where: {
        id: req.user!.id
      },
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
        createdAt: true,
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

    if (newPassword.length < 8) {
      throw createError('New password must be at least 8 characters long', 400);
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw createError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: {
        id: req.user!.id
      },
      data: {
        password: hashedNewPassword
      }
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

// Helper function to test WhatsApp connection
async function testWhatsAppConnection(credentials: any): Promise<boolean> {
  try {
    // This is a simplified test - in reality, you'd make a real API call to WhatsApp
    // For now, we'll just check if the credentials are properly formatted
    
    if (!credentials.accessToken || !credentials.phoneNumberId) {
      return false;
    }

    // Additional validation logic would go here
    // For example, making a test API call to WhatsApp's Graph API
    
    return true; // Simplified for demo purposes
  } catch (error) {
    return false;
  }
}

export default router;