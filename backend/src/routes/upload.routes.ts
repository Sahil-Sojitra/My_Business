import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { storageService } from '../services/storage.service.js';

const router: Router = Router();

// All upload endpoints require authenticated broker identity
router.use(authenticate);

/**
 * POST /api/uploads/presign
 * Asynchronous, non-blocking upload initialization.
 * Returns a presigned B2 upload URL and PENDING status.
 * Client uploads directly to Backblaze B2 without blocking the Node server.
 */
router.post('/presign', async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, fileSize, category } = req.body;

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'fileName is required.',
        statusCode: 400,
      });
    }

    const cleanCategory =
      category === 'chitthi' ? ('chitthi' as const) : ('bill' as const);

    const result = await storageService.requestPresignedUpload({
      fileName,
      fileType: fileType || 'application/octet-stream',
      fileSize: typeof fileSize === 'number' ? fileSize : undefined,
      category: cleanCategory,
      userId: req.user!.id,
    });

    return res.status(200).json(result);
  } catch (err: unknown) {
    console.error('[Presign Upload Error]', err);
    return res.status(500).json({
      error: 'Upload Initialization Failed',
      message: err instanceof Error ? err.message : 'Failed to generate upload URL.',
      statusCode: 500,
    });
  }
});

/**
 * POST /api/uploads/confirm
 * Called by client after directly uploading to Backblaze B2.
 * Updates the upload status from PENDING to SUCCESSFUL.
 */
router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const { fileKey } = req.body;

    if (!fileKey || typeof fileKey !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'fileKey is required to confirm upload.',
        statusCode: 400,
      });
    }

    const result = await storageService.confirmUpload(fileKey, req.user!.id);
    return res.status(200).json(result);
  } catch (err: unknown) {
    console.error('[Confirm Upload Error]', err);
    return res.status(500).json({
      error: 'Confirmation Failed',
      message: err instanceof Error ? err.message : 'Failed to confirm upload.',
      statusCode: 500,
    });
  }
});

/**
 * GET /api/uploads/view
 * Generates a signed view URL for downloading/viewing a file.
 */
router.get('/view', async (req: Request, res: Response) => {
  try {
    const fileKey = req.query.key as string;
    if (!fileKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter "key" is required.',
        statusCode: 400,
      });
    }

    const url = await storageService.getPresignedDownloadUrl(fileKey);
    return res.status(200).json({ url });
  } catch (err: unknown) {
    console.error('[View Upload Error]', err);
    return res.status(500).json({
      error: 'View URL Failed',
      message: err instanceof Error ? err.message : 'Failed to generate view URL.',
      statusCode: 500,
    });
  }
});

/**
 * POST /api/uploads/configure-cors
 * Programmatically updates Backblaze B2 bucket CORS rules to allow PUT, POST, GET, DELETE.
 */
router.post('/configure-cors', async (_req: Request, res: Response) => {
  try {
    const result = await storageService.configureBucketCors();
    return res.status(200).json(result);
  } catch (err: unknown) {
    console.error('[Configure CORS Error]', err);
    return res.status(500).json({
      error: 'CORS Configuration Failed',
      message: err instanceof Error ? err.message : 'Failed to configure B2 bucket CORS.',
      statusCode: 500,
    });
  }
});

/**
 * GET /api/uploads/cors
 * Retrieves active CORS rules from the Backblaze B2 bucket.
 */
router.get('/cors', async (_req: Request, res: Response) => {
  try {
    const rules = await storageService.getBucketCors();
    return res.status(200).json({
      bucket: process.env.B2_BUCKET_NAME,
      corsRules: rules,
    });
  } catch (err: unknown) {
    console.error('[Get CORS Error]', err);
    return res.status(500).json({
      error: 'Get CORS Failed',
      message: err instanceof Error ? err.message : 'Failed to retrieve B2 bucket CORS.',
      statusCode: 500,
    });
  }
});

export default router;
