import { Request, Response } from 'express';
import { uploadToR2 } from '../services/cloudflareService.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// For file uploads, we'll use multer middleware
// This controller handles the upload logic

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/**
 * Upload print image to R2
 */
export async function uploadPrint(req: Request, res: Response) {
  try {
    logger.info('Print upload request received', {
      context: 'PrintController',
      metadata: {
        hasFile: !!req.file,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype,
      },
    });

    if (!req.file) {
      logger.warn('Print upload failed: No file provided', { context: 'PrintController' });
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      logger.warn('Print upload failed: Invalid file type', {
        context: 'PrintController',
        metadata: { mimeType: req.file.mimetype, allowedTypes: ALLOWED_TYPES },
      });
      return res.status(400).json({
        error: 'Invalid file type. Allowed types: PNG, JPEG, JPG, WebP',
      });
    }

    // Validate file size
    if (req.file.size > MAX_FILE_SIZE) {
      logger.warn('Print upload failed: File too large', {
        context: 'PrintController',
        metadata: { fileSize: req.file.size, maxSize: MAX_FILE_SIZE },
      });
      return res.status(400).json({
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }

    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `prints/user-uploads/${uuidv4()}.${fileExtension}`;

    logger.info('Uploading print to R2', {
      context: 'PrintController',
      metadata: { fileName, size: req.file.size },
    });

    // Upload to R2
    const publicUrl = await uploadToR2(fileName, req.file.buffer, req.file.mimetype);

    logger.info('Print uploaded successfully', {
      context: 'PrintController',
      metadata: { fileName, publicUrl },
    });

    res.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
    });
  } catch (error) {
    logger.error('Error uploading print', {
      context: 'PrintController',
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: {
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype,
      },
    });
    res.status(500).json({
      error: 'Failed to upload print',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

