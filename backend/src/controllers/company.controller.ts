import { Request, Response } from 'express';
import {
  createCompanySchema,
  updateCompanySchema,
} from '../schemas/company.schema.js';
import {
  companyService,
  CompanyError,
} from '../services/company.service.js';

/**
 * GET /api/companies
 * Retrieves all registered buyer firms for the authenticated broker.
 */
export const getCompanies = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
        statusCode: 401,
      });
    }

    const { search } = req.query;
    const companies = await companyService.getCompanies(
      userId,
      typeof search === 'string' ? search : undefined
    );

    return res.status(200).json(companies);
  } catch (err: unknown) {
    console.error('[GetCompanies Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve companies.',
      statusCode: 500,
    });
  }
};

/**
 * GET /api/companies/:id
 * Retrieves a single company by ID with verified broker ownership.
 */
export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
        statusCode: 401,
      });
    }

    const id = req.params.id as string;
    const company = await companyService.getCompanyById(id, userId);

    return res.status(200).json(company);
  } catch (err: unknown) {
    if (err instanceof CompanyError) {
      return res.status(err.statusCode).json({
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[GetCompanyById Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve company details.',
      statusCode: 500,
    });
  }
};

/**
 * POST /api/companies
 * Registers a new client company associated with the authenticated broker.
 */
export const createCompany = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
        statusCode: 401,
      });
    }

    const parseResult = createCompanySchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return res.status(400).json({
        error: 'Bad Request',
        message: firstIssue.message,
        statusCode: 400,
        details: parseResult.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const company = await companyService.createCompany(userId, parseResult.data);
    return res.status(201).json(company);
  } catch (err: unknown) {
    console.error('[CreateCompany Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create company.',
      statusCode: 500,
    });
  }
};

/**
 * PUT /api/companies/:id
 * Updates an existing company with partial fields.
 */
export const updateCompany = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
        statusCode: 401,
      });
    }

    const id = req.params.id as string;
    const parseResult = updateCompanySchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return res.status(400).json({
        error: 'Bad Request',
        message: firstIssue.message,
        statusCode: 400,
        details: parseResult.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const updated = await companyService.updateCompany(
      id,
      userId,
      parseResult.data
    );
    return res.status(200).json(updated);
  } catch (err: unknown) {
    if (err instanceof CompanyError) {
      return res.status(err.statusCode).json({
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[UpdateCompany Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update company.',
      statusCode: 500,
    });
  }
};

/**
 * DELETE /api/companies/:id
 * Deletes a client company with broker ownership verification.
 */
export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
        statusCode: 401,
      });
    }

    const id = req.params.id as string;
    const result = await companyService.deleteCompany(id, userId);

    return res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof CompanyError) {
      return res.status(err.statusCode).json({
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[DeleteCompany Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete company.',
      statusCode: 500,
    });
  }
};
