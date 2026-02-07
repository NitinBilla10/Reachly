import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { createQuickReplySchema, updateQuickReplySchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all quick replies
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.query;
    
    const where: any = {
      userId: req.user!.id
    };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const quickReplies = await prisma.quickReply.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: quickReplies
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single quick reply
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const quickReply = await prisma.quickReply.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!quickReply) {
      throw createError('Quick reply not found', 404);
    }

    res.json({
      success: true,
      data: quickReply
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new quick reply
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createQuickReplySchema.parse(req.body);

    // Check if quick reply with this keyword already exists
    const existingQuickReply = await prisma.quickReply.findFirst({
      where: {
        keyword: validatedData.keyword,
        userId: req.user!.id
      }
    });

    if (existingQuickReply) {
      throw createError('Quick reply with this keyword already exists', 400);
    }

    const quickReply = await prisma.quickReply.create({
      data: {
        ...validatedData,
        userId: req.user!.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Quick reply created successfully',
      data: quickReply
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

// Update quick reply
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateQuickReplySchema.parse(req.body);

    // Check if quick reply exists and belongs to user
    const existingQuickReply = await prisma.quickReply.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingQuickReply) {
      throw createError('Quick reply not found', 404);
    }

    // If updating keyword, check for duplicates
    if (validatedData.keyword && validatedData.keyword !== existingQuickReply.keyword) {
      const duplicateQuickReply = await prisma.quickReply.findFirst({
        where: {
          keyword: validatedData.keyword,
          userId: req.user!.id,
          id: { not: id }
        }
      });

      if (duplicateQuickReply) {
        throw createError('Quick reply with this keyword already exists', 400);
      }
    }

    const quickReply = await prisma.quickReply.update({
      where: { id },
      data: validatedData
    });

    res.json({
      success: true,
      message: 'Quick reply updated successfully',
      data: quickReply
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

// Delete quick reply
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if quick reply exists and belongs to user
    const existingQuickReply = await prisma.quickReply.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingQuickReply) {
      throw createError('Quick reply not found', 404);
    }

    await prisma.quickReply.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Quick reply deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Test quick reply
router.post('/:id/test', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { testMessage } = req.body;

    if (!testMessage) {
      throw createError('Test message is required', 400);
    }

    const quickReply = await prisma.quickReply.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!quickReply) {
      throw createError('Quick reply not found', 404);
    }

    // Test the matching logic
    let matches = false;
    const content = testMessage.toLowerCase();
    const keyword = quickReply.keyword.toLowerCase();

    switch (quickReply.matchType) {
      case 'exact':
        matches = content === keyword;
        break;
      case 'contains':
        matches = content.includes(keyword);
        break;
      case 'starts_with':
        matches = content.startsWith(keyword);
        break;
    }

    res.json({
      success: true,
      data: {
        quickReply,
        testMessage,
        matches,
        wouldReply: matches && quickReply.isActive
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
