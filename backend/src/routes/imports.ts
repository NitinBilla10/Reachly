import { Router, Response } from 'express';
import { prisma } from '../services/database';
import { createError } from '../middleware/errorHandler';
import { createImportSchema } from '../validation/common';
import { AuthRequest } from '../middleware/auth';
import { importQueue } from '../services/queue';
import multer from 'multer';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// Get all import jobs
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const imports = await prisma.importJob.findMany({
      where: {
        userId: req.user!.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: imports
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Get import job by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const importJob = await prisma.importJob.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!importJob) {
      throw createError('Import job not found', 404);
    }

    res.json({
      success: true,
      data: importJob
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload and process file
router.post('/', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const fileType = path.extname(req.file.originalname).toLowerCase() === '.csv' ? 'csv' : 'xlsx';
    
    // Parse file to get columns and preview
    let columns: string[] = [];
    let preview: any[] = [];
    let totalRows = 0;

    if (fileType === 'csv') {
      const results: any[] = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file!.path)
          .pipe(csv())
          .on('data', (data) => {
            if (results.length < 6) {
              results.push(data);
            }
            totalRows++;
          })
          .on('end', () => {
            if (results.length > 0) {
              columns = Object.keys(results[0]);
              preview = results.slice(0, 5);
            }
            resolve(null);
          })
          .on('error', reject);
      });
    } else {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      if (data.length > 0) {
        columns = Object.keys(data[0] as object);
        preview = data.slice(0, 5);
      }
      totalRows = data.length;
    }

    // Create import job
    const importJob = await prisma.importJob.create({
      data: {
        userId: req.user!.id,
        fileName: req.file.originalname,
        fileType,
        status: 'pending',
        totalRows,
      }
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        importJob,
        columns,
        preview,
        totalRows
      }
    });
  } catch (error: any) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

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

// Start import with column mapping
router.post('/:id/start', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { columnMapping, duplicateStrategy } = req.body;

    const importJob = await prisma.importJob.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!importJob) {
      throw createError('Import job not found', 404);
    }

    if (importJob.status !== 'pending') {
      throw createError('Import job has already been processed', 400);
    }

    // Validate column mapping
    if (!columnMapping || !columnMapping.name || !columnMapping.phone) {
      throw createError('Column mapping must include name and phone fields', 400);
    }

    // Update import job
    await prisma.importJob.update({
      where: { id },
      data: {
        status: 'processing',
        columnMapping,
        duplicateStrategy: duplicateStrategy || 'skip',
      }
    });

    // Add to queue
    await importQueue.add('process-import', {
      importId: id,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Import started successfully',
      data: {
        importId: id,
        status: 'processing'
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel import
router.post('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const importJob = await prisma.importJob.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!importJob) {
      throw createError('Import job not found', 404);
    }

    if (importJob.status !== 'processing') {
      throw createError('Only processing imports can be cancelled', 400);
    }

    await prisma.importJob.update({
      where: { id },
      data: {
        status: 'failed',
        errorLog: ['Cancelled by user']
      }
    });

    res.json({
      success: true,
      message: 'Import cancelled successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete import job
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const importJob = await prisma.importJob.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!importJob) {
      throw createError('Import job not found', 404);
    }

    await prisma.importJob.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Import job deleted successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Download template CSV
router.get('/template/csv', async (req: AuthRequest, res: Response) => {
  try {
    const template = 'name,phone,email,company,notes\nJohn Doe,+1234567890,john@example.com,ABC Inc,Customer note\nJane Smith,+0987654321,jane@example.com,XYZ Corp,Another note';
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customer-import-template.csv');
    res.send(template);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
