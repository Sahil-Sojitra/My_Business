import swaggerUi from 'swagger-ui-express';
import { Router, Request, Response } from 'express';

/**
 * OpenAPI 3.0.3 specification for My_Business backend API.
 * Provides clear interactive documentation and schema contracts matching FastAPI's /docs.
 */
export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'My_Business Backend API',
    version: '1.0.0',
    description:
      'Interactive OpenAPI 3.0 documentation for the My_Business ledger management backend API. You can explore, inspect schemas, and execute real-time requests directly using the Swagger UI.',
    contact: {
      name: 'My_Business API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
    {
      url: '/',
      description: 'Current host',
    },
  ],
  tags: [
    {
      name: 'System',
      description: 'System diagnostic, service status, and PostgreSQL database connectivity checks',
    },
  ],
  paths: {
    '/': {
      get: {
        summary: 'API Information',
        description: 'Returns basic API metadata, current stage, and links to documentation.',
        tags: ['System'],
        responses: {
          '200': {
            description: 'API information retrieved successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RootInfoResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/health': {
      get: {
        summary: 'Database & System Health Check',
        description:
          'Performs a real-time health probe against the API process and verifies active PostgreSQL database connectivity using a Prisma ping query (`SELECT 1`).',
        tags: ['System'],
        responses: {
          '200': {
            description: 'API is healthy and PostgreSQL is connected.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthSuccessResponse',
                },
                example: {
                  status: 'healthy',
                  api: 'up',
                  database: 'connected',
                  timestamp: '2026-10-17T17:00:00.000Z',
                },
              },
            },
          },
          '503': {
            description: 'PostgreSQL database is disconnected or unreachable.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthErrorResponse',
                },
                example: {
                  status: 'unhealthy',
                  api: 'up',
                  database: 'disconnected',
                  timestamp: '2026-10-17T17:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      RootInfoResponse: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'My_Business Backend API' },
          version: { type: 'string', example: '1.0.0' },
          stage: { type: 'string', example: 'Stage 1: Foundation & PostgreSQL Connectivity' },
          status: { type: 'string', example: 'running' },
          endpoints: {
            type: 'object',
            properties: {
              health: { type: 'string', example: '/api/health' },
              docs: { type: 'string', example: '/docs' },
              openapi: { type: 'string', example: '/openapi.json' },
            },
          },
        },
        required: ['name', 'version', 'status', 'endpoints'],
      },
      HealthSuccessResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'healthy' },
          api: { type: 'string', example: 'up' },
          database: { type: 'string', example: 'connected' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-10-17T17:00:00.000Z' },
        },
        required: ['status', 'api', 'database', 'timestamp'],
      },
      HealthErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'unhealthy' },
          api: { type: 'string', example: 'up' },
          database: { type: 'string', example: 'disconnected' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-10-17T17:00:00.000Z' },
        },
        required: ['status', 'api', 'database', 'timestamp'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Not Found' },
          message: { type: 'string', example: 'The requested route does not exist.' },
        },
        required: ['error', 'message'],
      },
    },
  },
};

/**
 * Swagger UI options for a clean, FastAPI-like documentation interface.
 */
export const swaggerUiOptions: swaggerUi.SwaggerOptions = {
  customSiteTitle: 'My_Business API - Swagger UI',
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-size: 28px; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    tryItOutEnabled: true,
  },
};

/**
 * Express router serving /docs, /api/docs, and /openapi.json
 */
const docsRouter = Router();

// Raw OpenAPI JSON specification (matches FastAPI's /openapi.json)
docsRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// Swagger UI interactive documentation (matches FastAPI's /docs)
docsRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
docsRouter.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

export default docsRouter;
