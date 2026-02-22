import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Store for tracking upload progress
interface UploadProgress {
  [userId: string]: {
    filename: string;
    total: number;
    processed: number;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    error?: string;
    createdAt: Date;
  }
}

const uploadProgress = new Map<string, UploadProgress>();

// Configure multer for CSV upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

export interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

// Middleware to track upload progress
export const trackUploadProgress = (req: MulterRequest, res: Response, next: NextFunction) => {
  const uploadHandler = upload.single('file');

  uploadHandler(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const userId = (req as any).user?.id;
    const filename = req.file.originalname;

    // Initialize upload progress
    const progressId = `${userId}-${Date.now()}`;
    
    uploadProgress.set(progressId, {
      filename,
      total: 100, // Will be updated based on file size
      processed: 0,
      status: 'uploading',
      createdAt: new Date()
    });

    // Send progress update via Socket.io
    const { getSocketService } = await import('../services/socket');
    const socketService = getSocketService();
    
    if (socketService) {
      socketService.emitUploadProgress(userId, {
        type: 'upload_started',
        progressId,
        filename,
        percentage: 0
      });
    }

    try {
      // Parse CSV file
      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
        throw new Error('CSV file is empty');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const totalCustomers = lines.length - 1; // Exclude header row
      
      // Required columns
      const requiredColumns = ['name', 'phone', 'email'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // Map CSV columns to database fields
      const customers = [];
      let processed = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].split(',');
        
        if (line.length !== headers.length) {
          continue; // Skip malformed rows
        }

        const customerData: any = {
          userId,
          name: line[headers.indexOf('name')]?.trim() || '',
          phone: line[headers.indexOf('phone')]?.trim() || '',
          email: line[headers.indexOf('email')]?.trim() || '',
          notes: line[headers.indexOf('notes')]?.trim() || '',
          gender: line[headers.indexOf('gender')]?.trim() || null,
          company: line[headers.indexOf('company')]?.trim() || '',
          source: line[headers.indexOf('source')]?.trim() || 'import',
          optIn: true, // Default to true if not specified
        };

        // Handle optional columns
        const companyIndex = headers.indexOf('company');
        if (companyIndex >= 0 && line[companyIndex]) {
          customerData.company = line[companyIndex].trim();
        }

        const sourceIndex = headers.indexOf('source');
        if (sourceIndex >= 0 && line[sourceIndex]) {
          customerData.source = line[sourceIndex].trim();
        }

        const genderIndex = headers.indexOf('gender');
        if (genderIndex >= 0 && line[genderIndex]) {
          customerData.gender = line[genderIndex].trim();
        }

        const notesIndex = headers.indexOf('notes');
        if (notesIndex >= 0 && line[notesIndex]) {
          customerData.notes = line[notesIndex].trim();
        }

        customers.push(customerData);
        processed++;

        // Update progress every 10%
        if (processed % Math.ceil(totalCustomers / 10) === 0) {
          const percentage = Math.round((processed / totalCustomers) * 100);
          
          // Update progress
          uploadProgress.set(progressId, {
            ...uploadProgress.get(progressId),
            processed,
            total: totalCustomers,
            status: 'processing',
            percentage
          });

          // Send progress via socket
          if (socketService) {
            socketService.emitUploadProgress(userId, {
              type: 'import_progress',
              progressId,
              filename,
              percentage,
              processed,
              total: totalCustomers
            });
          }
        }
      }

      // Complete upload progress
      uploadProgress.set(progressId, {
        ...uploadProgress.get(progressId),
        processed: totalCustomers,
        total: totalCustomers,
        status: 'completed',
        percentage: 100
      });

      if (socketService) {
        socketService.emitUploadProgress(userId, {
          type: 'import_completed',
          progressId,
          filename,
          percentage: 100,
          processed: totalCustomers,
          total: totalCustomers
        });
      }

      // Return immediately (will process in background)
      res.json({
        success: true,
        message: 'File uploaded successfully. Import is being processed.',
        data: {
          progressId,
          filename,
          totalCustomers,
          message: 'You can track the import progress in real-time. Check your notifications for updates.'
        }
      });

    } catch (error: any) {
      // Handle errors
      uploadProgress.set(progressId, {
        ...uploadProgress.get(progressId),
        status: 'failed',
        error: error.message
      });

      if (socketService) {
        const socketService = await import('../services/socket');
        socketService.getSocketService().emitUploadProgress(userId, {
          type: 'import_failed',
          progressId,
          filename,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to process CSV file'
      });
    }

    next();
  };
};

// Get upload progress for a user
export const getUploadProgress = (userId: string): UploadProgress[] => {
  const userProgress: Array.from(uploadProgress.entries())
    const [userId]: UploadProgress[] = userProgress
    .filter(([key]) => key.startsWith(userId))
    .map(([_, progress]) => progress);

  return userProgress;
};

// Helper function to process CSV import in background
export const processCSVImport = async (userId: string, csvContent: string, headers: string[], progressId: string) => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const totalCustomers = lines.length - 1;
  const customers: any[] = [];

  // Get database client
  const { prisma } = await import('../services/database');

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].split(',');
    
    if (line.length !== headers.length) {
      continue;
    }

    const customerData = {
      userId,
      name: line[headers.indexOf('name')]?.trim() || '',
      phone: line[headers.indexOf('phone')]?.trim() || '',
      email: line[headers.indexOf('email')]?.trim() || '',
      notes: line[headers.indexOf('notes')]?.trim() || '',
      gender: line[headers.indexOf('gender')]?.trim() || null,
      company: line[headers.indexOf('company')]?.trim() || '',
      source: line[headers.indexOf('source')]?.trim() || 'import',
      optIn: true,
    };

    // Handle optional columns
    const companyIndex = headers.indexOf('company');
    if (companyIndex >= 0 && line[companyIndex]) {
      customerData.company = line[companyIndex].trim();
    }

    const sourceIndex = headers.indexOf('source');
    if (sourceIndex >= 0 && line[sourceIndex]) {
      customerData.source = line[sourceIndex].trim();
    }

    const genderIndex = headers.indexOf('gender');
    if (genderIndex >= 0 && line[genderIndex]) {
      customerData.gender = line[genderIndex].trim();
    }

    const notesIndex = headers.indexOf('notes');
    if (notesIndex >= 0 && line[notesIndex]) {
      customerData.notes = line[notesIndex].trim();
    }

    customers.push(customerData);

    // Batch insert (100 records at a time)
    const batchSize = 100;
    for (let j = 0; j < customers.length; j += batchSize) {
      const batch = customers.slice(j, j + batchSize);
      await prisma.customer.createMany({ data: batch });
      
      // Update progress
      const processed = Math.min(j + batchSize, customers.length);
      const percentage = Math.round((processed / customers.length) * 100);
      
      const { getSocketService } = await import('../services/socket');
      const socketService = getSocketService();
      
      if (socketService) {
        socketService.emitUploadProgress(userId, {
          type: 'import_progress',
          progressId,
          percentage,
          processed,
          total: customers.length
        });
      }
    }

  // Mark import as completed
  const finalProgress = uploadProgress.get(progressId);
  if (finalProgress) {
    uploadProgress.set(progressId, {
      ...finalProgress,
      status: 'completed',
      percentage: 100
    });

    const socketService = await import('../services/socket');
    const socketService.getSocketService().emitUploadProgress(userId, {
      type: 'import_completed',
      progressId,
      filename: finalProgress.filename,
      percentage: 100,
      processed: totalCustomers,
      total: totalCustomers
    });
  }
};

// Export customers to CSV
export const exportCustomersToCSV = async (userId: string, customerIds: string[]): Promise<{ success: boolean; csv: string; error?: string }> => {
  try {
    // Get customers
    const { prisma } = await import('../services/database');
    
    const customers = await prisma.customer.findMany({
      where: {
        userId,
        id: { in: customerIds }
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

    if (customers.length === 0) {
      return {
        success: false,
        error: 'No customers found to export'
      };
    }

    // Define CSV headers
    const headers = ['name', 'phone', 'email', 'company', 'source', 'gender', 'optIn', 'tags', 'notes', 'createdAt'];

    // Build CSV content
    const csvRows = customers.map((customer) => {
      const tagNames = customer.tags.map((ct: any) => ct.tag?.name).join('; ');
      
      return [
        `"${customer.name || ''}"`,
        `"${customer.phone || ''}"`,
        `"${customer.email || ''}"`,
        `"${customer.company || ''}"`,
        `"${customer.source || ''}"`,
        `"${customer.gender || ''}"`,
        `"${customer.optIn ? 'true' : 'false'}"`,
        `"${tagNames}"`,
        `"${(customer.notes || '').replace(/"/g, '""')}"`,
        `"${new Date(customer.createdAt).toISOString()}"`
      ];
    });

    // Add header row
    const csvContent = [
      headers.join(','),
      ...csvRows
    ].map(row => row.join(',')).join('\n');

    return {
      success: true,
      csv: csvContent,
      filename: `customers_export_${new Date().toISOString().split('T')[0]}.csv`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to export customers to CSV'
    };
  }
};

// Helper function to get column mapping
export const getColumnMapping = (csvHeaders: string[]) => {
  const headerMap: Record<string, number> = {};
  
  csvHeaders.forEach((header, index) => {
    headerMap[header.toLowerCase().trim()] = index;
  });

  return headerMap;
};

// Validate CSV file structure
export const validateCSVStructure = (csvContent: string) => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredColumns = ['name', 'phone'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  return {
    isValid: true,
    headers,
    totalRows: lines.length - 1
  };
};
