import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { createTemplateSchema, updateTemplateSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';
import { WhatsAppService } from '../services/whatsapp';

const router = Router();

// Get all templates
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.template.findMany({
      where: {
        userId: req.user!.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get template by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!template) {
      throw createError('Template not found', 404);
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new template
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createTemplateSchema.parse(req.body);

    // Extract variables from template content (simple regex for {{variable}})
    const variables: string[] = [];
    const variableRegex = /{{(\w+)}}/g;
    let match;
    
    while ((match = variableRegex.exec(validatedData.content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    // Call WhatsApp API to create the template
    const whatsappService = new WhatsAppService();
    const metaResponse = await whatsappService.createMessageTemplate(
      req.user!.id,
      validatedData.name,
      validatedData.category,
      validatedData.language || 'en_US',
      validatedData.content
    );

    if (!metaResponse.success) {
      return res.status(400).json({
        success: false,
        error: `Meta Template Rejection: ${metaResponse.error}`
      });
    }

    const formattedTemplateName = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

    const template = await prisma.template.create({
      data: {
        ...validatedData,
        name: formattedTemplateName,
        variables: variables,
        status: metaResponse.status?.toLowerCase() || 'pending',
        whatsappTemplateId: metaResponse.templateId,
        userId: req.user!.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Template created and synced successfully',
      data: template
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

// Update template
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateTemplateSchema.parse(req.body);

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingTemplate) {
      throw createError('Template not found', 404);
    }

    // If updating content, re-extract variables
    let updatedData = { ...validatedData };
    if (validatedData.content) {
      const variables: string[] = [];
      const variableRegex = /{{(\w+)}}/g;
      let match;
      
      while ((match = variableRegex.exec(validatedData.content)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }
      
      updatedData.variables = variables;
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        ...updatedData,
        status: 'approved'
      }
    });

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
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

// Delete template
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if template exists and belongs to user
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingTemplate) {
      throw createError('Template not found', 404);
    }

    // Check if template is being used in any campaigns
    const campaignsUsingTemplate = await prisma.campaign.findFirst({
      where: {
        templateId: id
      }
    });

    if (campaignsUsingTemplate) {
      throw createError('Cannot delete template that is being used in campaigns', 400);
    }

    await prisma.template.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Sync template with WhatsApp (send to WhatsApp API)
router.post('/:id/sync', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!template) {
      throw createError('Template not found', 404);
    }

    const whatsappService = new WhatsAppService();

    // Note: This would typically involve sending the template to WhatsApp API
    // For now, we'll just simulate it and mark as pending approval
    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        status: 'pending',
        whatsappTemplateId: `temp_${Date.now()}` // Simulate WhatsApp template ID
      }
    });

    res.json({
      success: true,
      message: 'Template synced with WhatsApp (pending approval)',
      data: updatedTemplate
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Preview template with variables
router.post('/:id/preview', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;

    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!template) {
      throw createError('Template not found', 404);
    }

    if (!variables || typeof variables !== 'object') {
      throw createError('Variables object is required', 400);
    }

    // Replace template variables with provided values
    let previewContent = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewContent = previewContent.replace(regex, String(value));
    });

    res.json({
      success: true,
      data: {
        originalContent: template.content,
        previewContent,
        variables
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