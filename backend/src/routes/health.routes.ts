import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router: Router = Router();

/**
 * GET /api/health
 * Verifies API process status and PostgreSQL database connectivity via Prisma.
 * - HTTP 200: API is running and database responds to a ping query.
 * - HTTP 503: Database is unreachable or query failed.
 * Security: Internal error details, stack traces, and database credentials are never leaked.
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Execute a lightweight query to verify active PostgreSQL connectivity
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: 'healthy',
      api: 'up',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Log diagnostic error on server console without leaking secrets to client
    const safeError = error instanceof Error ? error.message.replace(/:\/\/[^@]+@/, '://[MASKED]@') : String(error);
    console.error('[Health Check] Database probe failed:', safeError);

    // Return service unavailable without leaking connection strings or stack traces
    return res.status(503).json({
      status: 'unhealthy',
      api: 'up',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
