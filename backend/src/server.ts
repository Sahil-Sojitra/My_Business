import 'dotenv/config';
import http from 'node:http';
import app from './app.js';
import prisma from './lib/prisma.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const server: http.Server = app.listen(PORT, async () => {
  console.log(`[My_Business API] Server running on http://localhost:${PORT}`);
  console.log(`[My_Business API] Swagger UI at http://localhost:${PORT}/docs`);
  console.log(`[My_Business API] Health endpoint at http://localhost:${PORT}/api/health`);

  // Verify database connectivity on startup
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[My_Business API] Database connected successfully (Prisma Postgres Cloud)');
  } catch (error) {
    console.error('[My_Business API] Database connection failed on startup:');
    if (error instanceof Error) {
      const safeMessage = error.message.replace(/:\/\/[^@]+@/, '://[MASKED]@');
      console.error(`  ${safeMessage}`);
    }
  }
});

/**
 * Handle graceful shutdown by stopping the HTTP listener and closing Prisma connections.
 */
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[My_Business API] Received ${signal}. Starting graceful shutdown...`);

  // Force shutdown timeout in case connections hang
  const forceTimer = setTimeout(() => {
    console.error('[My_Business API] Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  server.close(async (err) => {
    if (err) {
      console.error('[My_Business API] Error closing HTTP server:', err);
      process.exit(1);
    }
    console.log('[My_Business API] HTTP server closed.');

    try {
      await prisma.$disconnect();
      console.log('[My_Business API] PostgreSQL connection closed via Prisma.');
      process.exit(0);
    } catch (disconnectErr) {
      console.error('[My_Business API] Error disconnecting Prisma:', disconnectErr);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default server;
