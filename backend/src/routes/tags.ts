import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { createTagSchema, updateTagSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all tags
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        _count: {
          select: {
            customers: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: tags
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new tag
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createTagSchema.parse(req.body);

    // Check if tag with this name already exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: validatedData.name,
        userId: req.user!.id
      }
    });

    if (existingTag) {
      throw createError('Tag with this name already exists', 400);
    }

    const tag = await prisma.tag.create({
      data: {
        ...validatedData,
        userId: req.user!.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tag
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

// Update tag
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateTagSchema.parse(req.body);

    // Check if tag exists and belongs to user
    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingTag) {
      throw createError('Tag not found', 404);
    }

    // If updating name, check for duplicates
    if (validatedData.name && validatedData.name !== existingTag.name) {
      const duplicateTag = await prisma.tag.findFirst({
        where: {
          name: validatedData.name,
          userId: req.user!.id,
          id: { not: id }
        }
      });

      if (duplicateTag) {
        throw createError('Tag with this name already exists', 400);
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: validatedData
    });

    res.json({
      success: true,
      message: 'Tag updated successfully',
      data: tag
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

// Delete tag
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if tag exists and belongs to user
    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingTag) {
      throw createError('Tag not found', 404);
    }

    // Check if tag is being used in any campaigns
    const campaignsUsingTag = await prisma.campaignMessage.findFirst({
      where: {
        tagId: id
      }
    });

    if (campaignsUsingTag) {
      throw createError('Cannot delete tag that is being used in campaigns', 400);
    }

    await prisma.tag.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get customers by tag
router.get('/:id/customers', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if tag exists and belongs to user
    const tag = await prisma.tag.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!tag) {
      throw createError('Tag not found', 404);
    }

    const customers = await prisma.customer.findMany({
      where: {
        userId: req.user!.id,
        tags: {
          some: {
            tagId: id
          }
        }
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedCustomers = customers.map(customer => ({
      ...customer,
      tags: customer.tags.map(ct => ct.tag)
    }));

    res.json({
      success: true,
      data: {
        tag,
        customers: formattedCustomers
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