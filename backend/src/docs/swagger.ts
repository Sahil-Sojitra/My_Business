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
      'Interactive OpenAPI 3.0 documentation for My_Business ledger, consignment billing, and Dalali commission management. Includes Bearer JWT authentication, multi-tenant company CRUD, static Dalali calculations, and live Swagger UI testing.',
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
    { name: 'Authentication', description: 'Broker registration, login via mobile number & password, and profile' },
    { name: 'Companies', description: 'Multi-tenant buyer firm / client ledger management' },
    { name: 'Bills', description: 'Consignment sales bills, nearest due date tracking, and static Dalali brokerage' },
    { name: 'Dashboard', description: 'Real-time brokerage receivable and turnover aggregations' },
    { name: 'Uploads', description: 'Bill PDF invoices and Chitthi delivery slip attachments' },
    { name: 'System', description: 'System health probe and database connectivity checks' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /api/auth/login or /api/auth/register',
      },
    },
    schemas: {
      RegisterInput: {
        type: 'object',
        required: ['name', 'mobileNumber', 'password'],
        properties: {
          name: { type: 'string', example: 'Sahil Sojitra' },
          mobileNumber: { type: 'string', example: '9825012345' },
          password: { type: 'string', example: 'Password123' },
          email: { type: 'string', format: 'email', example: 'broker@mybusiness.com' },
          businessName: { type: 'string', example: 'Sojitra Trade & Brokerage' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['mobileNumber', 'password'],
        properties: {
          mobileNumber: { type: 'string', example: '9825012345' },
          password: { type: 'string', example: 'Password123' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          mobileNumber: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', nullable: true },
          businessName: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/UserResponse' },
          token: { type: 'string' },
        },
      },
      CompanyInput: {
        type: 'object',
        required: ['name', 'contactNumber'],
        properties: {
          name: { type: 'string', example: 'Apex Global Traders' },
          contactNumber: { type: 'string', example: '9825012345' },
          ownerName: { type: 'string', example: 'Rajesh Sharma' },
          email: { type: 'string', format: 'email', example: 'contact@apextraders.com' },
          gstin: { type: 'string', example: '24AAACA1234A1Z5' },
          address: { type: 'string', example: 'Ring Road Market, Surat, Gujarat' },
          notes: { type: 'string', example: 'Primary yarn supplier. 30 days credit.' },
        },
      },
      CompanyResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          contactNumber: { type: 'string' },
          ownerName: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true },
          gstin: { type: 'string', nullable: true },
          address: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
          billsCount: { type: 'number', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      BillInput: {
        type: 'object',
        required: ['companyId', 'amount', 'date'],
        properties: {
          companyId: { type: 'string', format: 'uuid' },
          billNumber: { type: 'string', example: 'INV-2026-101' },
          amount: { type: 'number', example: 250000 },
          dalaliRate: { type: 'number', example: 1.5, default: 1.5 },
          dalaliAmount: { type: 'number', example: 3750 },
          date: { type: 'string', format: 'date', example: '2026-10-17' },
          dueDate: { type: 'string', format: 'date', example: '2026-11-17' },
          status: { type: 'string', enum: ['PENDING', 'OVERDUE', 'PARTIAL', 'PAID'], default: 'PENDING' },
          description: { type: 'string', example: 'Cotton yarn combed 40s lot' },
          billPdf: {
            type: 'object',
            nullable: true,
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['pdf'] },
              size: { type: 'string' },
              url: { type: 'string' },
            },
          },
          chitthi: {
            type: 'object',
            nullable: true,
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['photo', 'pdf'] },
              size: { type: 'string' },
              url: { type: 'string' },
            },
          },
        },
      },
      BillResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          companyId: { type: 'string', format: 'uuid' },
          companyName: { type: 'string' },
          billNumber: { type: 'string', nullable: true },
          amount: { type: 'number' },
          dalaliRate: { type: 'number' },
          dalaliAmount: { type: 'number' },
          date: { type: 'string' },
          dueDate: { type: 'string', nullable: true },
          status: { type: 'string' },
          description: { type: 'string', nullable: true },
          billPdf: { type: 'object', nullable: true },
          chitthi: { type: 'object', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DashboardSummaryResponse: {
        type: 'object',
        properties: {
          totalBillTurnover: { type: 'number', example: 627000 },
          totalDalaliReceivable: { type: 'number', example: 8627.5 },
          activeBillsCount: { type: 'number', example: 4 },
          pendingBillsCount: { type: 'number', example: 3 },
          overdueBillsCount: { type: 'number', example: 1 },
          settledBillsCount: { type: 'number', example: 0 },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'healthy' },
          api: { type: 'string', example: 'up' },
          database: { type: 'string', example: 'connected' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register Broker',
        description: 'Registers a new broker account using a unique 10-digit mobile number and password.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } },
        },
        responses: {
          '201': {
            description: 'Broker successfully registered',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '400': { description: 'Validation error' },
          '409': { description: 'Mobile number already registered' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign In Broker',
        description: 'Authenticates a broker with their normalized mobile number and password.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '401': { description: 'Invalid mobile number or password' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get Authenticated Broker Profile',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Authenticated user profile',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/companies': {
      get: {
        tags: ['Companies'],
        summary: 'List Companies',
        description: 'Retrieves all registered client firms belonging exclusively to the authenticated broker.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name, owner, phone, or GSTIN' },
        ],
        responses: {
          '200': {
            description: 'List of companies',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/CompanyResponse' } } } },
          },
        },
      },
      post: {
        tags: ['Companies'],
        summary: 'Create Company',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyInput' } } },
        },
        responses: {
          '201': {
            description: 'Company created successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyResponse' } } },
          },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/api/companies/{id}': {
      get: {
        tags: ['Companies'],
        summary: 'Get Company Details',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyResponse' } } } },
          '404': { description: 'Company not found or unauthorized' },
        },
      },
      put: {
        tags: ['Companies'],
        summary: 'Update Company',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyInput' } } },
        },
        responses: {
          '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyResponse' } } } },
          '404': { description: 'Company not found or unauthorized' },
        },
      },
      delete: {
        tags: ['Companies'],
        summary: 'Delete Company',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Company and associated bills deleted' },
          '404': { description: 'Company not found or unauthorized' },
        },
      },
    },
    '/api/bills': {
      get: {
        tags: ['Bills'],
        summary: 'List Bills',
        description: 'Retrieves sales bills sorted nearest due date first (`dueDate ASC NULLS LAST, date DESC`).',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'companyId', in: 'query', schema: { type: 'string' }, description: 'Filter by company ID' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ALL', 'PENDING', 'OVERDUE', 'PARTIAL', 'PAID'] } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search bill number, company name, description' },
        ],
        responses: {
          '200': {
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/BillResponse' } } } },
          },
        },
      },
      post: {
        tags: ['Bills'],
        summary: 'Create Consignment Bill',
        description: 'Records a new sales invoice. Automatically computes Dalali as `(amount * dalaliRate) / 100`.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BillInput' } } },
        },
        responses: {
          '201': { content: { 'application/json': { schema: { $ref: '#/components/schemas/BillResponse' } } } },
          '400': { description: 'Invalid company or validation error' },
        },
      },
    },
    '/api/bills/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Dashboard Metrics',
        description: 'Aggregates active bill volume, total receivable Dalali, and status counts for home screen cards.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardSummaryResponse' } } } },
        },
      },
    },
    '/api/bills/{id}': {
      get: {
        tags: ['Bills'],
        summary: 'Get Bill Details',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/BillResponse' } } } },
          '404': { description: 'Bill not found or unauthorized' },
        },
      },
      put: {
        tags: ['Bills'],
        summary: 'Update Bill',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BillInput' } } },
        },
        responses: {
          '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/BillResponse' } } } },
          '404': { description: 'Bill not found or unauthorized' },
        },
      },
      delete: {
        tags: ['Bills'],
        summary: 'Delete Bill',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Bill deleted successfully' },
          '404': { description: 'Bill not found or unauthorized' },
        },
      },
    },
    '/api/uploads': {
      post: {
        tags: ['Uploads'],
        summary: 'Upload Bill PDF or Chitthi Photo',
        description: 'Upload endpoint for documents. Validates file format and size, forwarding to cloud object storage.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  category: { type: 'string', enum: ['bill', 'chitthi'] },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'File uploaded' },
          '503': { description: 'Cloud storage provider pending configuration' },
        },
      },
    },
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Database & System Health Check',
        responses: {
          '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
          '503': { description: 'Database disconnected' },
        },
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

const docsRouter = Router();

// Raw OpenAPI JSON specification (FastAPI /openapi.json)
docsRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// Swagger UI interactive documentation (FastAPI /docs)
docsRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
docsRouter.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

export default docsRouter;
