import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/company.routes.js';
import billRoutes from './routes/bill.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import docsRouter from './docs/swagger.js';

const app: Application = express();

// Security and CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Informational root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'My_Business Backend API',
    version: '1.0.0',
    stage: 'Phase 2: Authentication & Multi-Tenancy',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      companies: '/api/companies',
      bills: {
        list: 'GET /api/bills',
        summary: 'GET /api/bills/summary',
        create: 'POST /api/bills',
      },
      uploads: 'POST /api/uploads',
      docs: '/docs',
      openapi: '/openapi.json',
    },
  });
});

// Swagger UI & OpenAPI Specification routes (FastAPI-style /docs and /openapi.json)
app.use(docsRouter);

// Register route modules
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api', healthRoutes);

// Fallback 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested route does not exist.',
  });
});

// Centralized error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Log server-side only for diagnostics
  console.error('[Unhandled Error]', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
  });
});

export default app;
