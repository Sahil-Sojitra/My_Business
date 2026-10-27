import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware.js';
import { testExtraction } from '../controllers/ai.controller.js';

const router: Router = Router();

// Memory-storage multer with strict 10 MB bounded size
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
    files: 1,
  },
});

// Middleware to capture and format Multer upload errors cleanly
const handleMulterUpload = (req: Request, res: Response, next: NextFunction) => {
  const uploadFields = upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]);

  uploadFields(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'PDF file size exceeds maximum limit of 10 MB.',
          statusCode: 400,
        });
      }
      return res.status(400).json({
        error: 'Bad Request',
        message: err.message || 'File upload failed.',
        statusCode: 400,
      });
    }
    next();
  });
};

/**
 * POST /api/v1/ai/test-extraction
 * Testing-only endpoint for diamond & commercial bill extraction.
 * Requires broker authentication.
 */
router.post('/test-extraction', authenticate, handleMulterUpload, testExtraction);

export default router;
