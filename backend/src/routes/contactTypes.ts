import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { createContactTypeSchema, updateContactTypeSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all contact types
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const contactTypes = await prisma.contactType.findMany({
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
      data: contactTypes
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get contact type by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const contactType = await prisma.contactType.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            company: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            customers: true
          }
        }
      }
    });

    if (!contactType) {
      throw createError('Contact type not found', 404);
    }

    res.json({
      success: true,
      data: contactType
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new contact type
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createContactTypeSchema.parse(req.body);

    // Check if contact type with this name already exists
    const existingContactType = await prisma.contactType.findFirst({
      where: {
        name: validatedData.name,
        userId: req.user!.id
      }
    });

    if (existingContactType) {
      throw createError('Contact type with this name already exists', 400);
    }

    const contactType = await prisma.contactType.create({
      data: {
        ...validatedData,
        userId: req.user!.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Contact type created successfully',
      data: contactType
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

// Update contact type
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateContactTypeSchema.parse(req.body);

    // Check if contact type exists and belongs to user
    const existingContactType = await prisma.contactType.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingContactType) {
      throw createError('Contact type not found', 404);
    }

    // If updating name, check for duplicates
    if (validatedData.name && validatedData.name !== existingContactType.name) {
      const duplicateContactType = await prisma.contactType.findFirst({
        where: {
          name: validatedData.name,
          userId: req.user!.id,
          id: { not: id }
        }
      });

      if (duplicateContactType) {
        throw createError('Contact type with this name already exists', 400);
      }
    }

    const contactType = await prisma.contactType.update({
      where: { id },
      data: validatedData
    });

    res.json({
      success: true,
      message: 'Contact type updated successfully',
      data: contactType
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

// Delete contact type
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if contact type exists and belongs to user
    const existingContactType = await prisma.contactType.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        _count: {
          select: {
            customers: true
          }
        }
      }
    });

    if (!existingContactType) {
      throw createError('Contact type not found', 404);
    }

    // Check if contact type is being used by any contacts
    if (existingContactType._count.customers > 0) {
      // Cascade delete - remove typeId from customers
      await prisma.customer.updateMany({
        where: {
          typeId: id
        },
        data: {
          typeId: null
        }
      });
    }

    // Delete the contact type
    await prisma.contactType.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Contact type deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
