import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  uploadMiddleware,
  storageProvider,
  formatBytes,
} from '../services/storage.service.js';

const router: Router = Router();

// Uploads require authenticated broker
router.use(authenticate);

/**
 * POST /api/uploads
 * Upload endpoint for Bill PDFs and Chitthi delivery voucher photos.
 * Memory buffered, validated for type and size, and sent to external cloud object storage.
 */
router.post(
  '/',
  uploadMiddleware.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No file uploaded. Please provide a "file" field in multipart/form-data.',
          statusCode: 400,
        });
      }

      const category = (req.body.category === 'chitthi' ? 'chitthi' : 'bill') as 'bill' | 'chitthi';
      const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'photo';
      const formattedSize = formatBytes(req.file.size);

      // Check external cloud object storage provider
      if (!storageProvider.isConfigured()) {
        return res.status(503).json({
          error: 'Storage Provider Pending',
          message:
            'External cloud object storage (e.g. AWS S3, Cloudinary, or Supabase Storage) has not been configured in .env yet. Upload integration is pending cloud storage credentials.',
          statusCode: 503,
          fileDetails: {
            name: req.file.originalname,
            type: fileType,
            size: formattedSize,
          },
        });
      }

      const result = await storageProvider.uploadFile(
        req.file,
        category,
        req.user!.id
      );

      return res.status(201).json({
        name: result.name || req.file.originalname,
        type: fileType,
        size: formattedSize,
        url: result.url,
      });
    } catch (err: unknown) {
      console.error('[Upload Error]', err);
      const message = err instanceof Error ? err.message : 'File upload failed.';
      return res.status(500).json({
        error: 'Upload Failed',
        message,
        statusCode: 500,
      });
    }
  }
);

export default router;
