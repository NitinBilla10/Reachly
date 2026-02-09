import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { getSocketService } from '../services/socket';

const router = Router();

// Get conversation notes
router.get('/conversations/:id/notes', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    const notes = await prisma.conversationNote.findMany({
      where: {
        conversationId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: notes
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Add conversation note
router.post('/conversations/:id/notes', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      throw createError('Note content is required', 400);
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    const note = await prisma.conversationNote.create({
      data: {
        conversationId: id,
        userId: req.user!.id,
        content: content.trim()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: note
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Update conversation note
router.put('/notes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      throw createError('Note content is required', 400);
    }

    const note = await prisma.conversationNote.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    const updatedNote = await prisma.conversationNote.update({
      where: { id },
      data: {
        content: content.trim(),
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete conversation note
router.delete('/notes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const note = await prisma.conversationNote.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!note) {
      throw createError('Note not found', 404);
    }

    await prisma.conversationNote.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all labels
router.get('/labels', async (req: AuthRequest, res: Response) => {
  try {
    const labels = await prisma.conversationLabel.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        _count: {
          select: {
            conversations: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: labels
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Create label
router.post('/labels', async (req: AuthRequest, res: Response) => {
  try {
    const { name, color } = req.body;

    if (!name || name.trim().length === 0) {
      throw createError('Label name is required', 400);
    }

    const label = await prisma.conversationLabel.create({
      data: {
        userId: req.user!.id,
        name: name.trim(),
        color: color || '#8B5CF6'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Label created successfully',
      data: label
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'A label with this name already exists'
      });
    }
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Update label
router.put('/labels/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const label = await prisma.conversationLabel.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!label) {
      throw createError('Label not found', 404);
    }

    const updatedLabel = await prisma.conversationLabel.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(color && { color })
      }
    });

    res.json({
      success: true,
      message: 'Label updated successfully',
      data: updatedLabel
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete label
router.delete('/labels/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const label = await prisma.conversationLabel.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!label) {
      throw createError('Label not found', 404);
    }

    await prisma.conversationLabel.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Label deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Add label to conversation
router.post('/conversations/:id/labels/:labelId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, labelId } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    const label = await prisma.conversationLabel.findFirst({
      where: {
        id: labelId,
        userId: req.user!.id
      }
    });

    if (!label) {
      throw createError('Label not found', 404);
    }

    await prisma.conversationLabelAssignment.create({
      data: {
        conversationId: id,
        labelId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Label added to conversation'
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Label already assigned to this conversation'
      });
    }
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove label from conversation
router.delete('/conversations/:id/labels/:labelId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, labelId } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    await prisma.conversationLabelAssignment.delete({
      where: {
        conversationId_labelId: {
          conversationId: id,
          labelId
        }
      }
    });

    res.json({
      success: true,
      message: 'Label removed from conversation'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Pin/unpin conversation
router.put('/conversations/:id/pin', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: {
        isPinned: isPinned === true
      }
    });

    const socketService = getSocketService();
    if (socketService) {
      socketService.emitConversationUpdate(req.user!.id, id, {
        isPinned: updatedConversation.isPinned
      });
    }

    res.json({
      success: true,
      message: isPinned ? 'Conversation pinned' : 'Conversation unpinned',
      data: updatedConversation
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
