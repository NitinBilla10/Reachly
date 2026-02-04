import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { createCustomerSchema, updateCustomerSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';
import { getSocketService } from '../services/socket';

const router = Router();

// Get all customers with pagination and search
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const tagIds = req.query.tagIds ? (req.query.tagIds as string).split(',') : [];
    
    const skip = (page - 1) * limit;

    const where: any = {
      userId: req.user!.id
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: { in: tagIds }
        }
      };
    }

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.customer.count({ where })
    ]);

    const formattedCustomers = customers.map(customer => ({
      ...customer,
      tags: customer.tags.map(ct => ct.tag)
    }));

    res.json({
      success: true,
      data: {
        customers: formattedCustomers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
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

// Get customer by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        conversations: {
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!customer) {
      throw createError('Customer not found', 404);
    }

    const formattedCustomer = {
      ...customer,
      tags: customer.tags.map(ct => ct.tag)
    };

    res.json({
      success: true,
      data: formattedCustomer
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new customer
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createCustomerSchema.parse(req.body);

    // Check if customer with this phone number already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: validatedData.phone,
        userId: req.user!.id
      }
    });

    if (existingCustomer) {
      throw createError('Customer with this phone number already exists', 400);
    }

    const { tags, ...customerData } = validatedData;

    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        userId: req.user!.id,
        tags: tags ? {
          create: tags.map(tagId => ({ tagId }))
        } : undefined
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    const formattedCustomer = {
      ...customer,
      tags: customer.tags.map(ct => ct.tag)
    };

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: formattedCustomer
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

// Update customer
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateCustomerSchema.parse(req.body);

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingCustomer) {
      throw createError('Customer not found', 404);
    }

    const { tags, ...customerData } = validatedData;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...customerData,
        ...(tags && {
          tags: {
            deleteMany: {},
            create: tags.map(tagId => ({ tagId }))
          }
        })
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    const formattedCustomer = {
      ...customer,
      tags: customer.tags.map(ct => ct.tag)
    };

    // Emit real-time update
    const socketService = getSocketService();
    if (socketService) {
      socketService.emitConversationUpdate(req.user!.id, id, {
        type: 'customer_updated',
        customer: formattedCustomer
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: formattedCustomer
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

// Delete customer
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingCustomer) {
      throw createError('Customer not found', 404);
    }

    await prisma.customer.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;