import { Request, Response } from 'express';
import {
  createBillSchema,
  updateBillSchema,
} from '../schemas/bill.schema.js';
import { billService, BillError } from '../services/bill.service.js';

/**
 * GET /api/bills
 * Retrieves all sales bills for the authenticated broker.
 */
export const getBills = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
        statusCode: 401,
      });
    }

    const { companyId, status, search } = req.query;
    const bills = await billService.getBills(userId, {
      companyId: typeof companyId === 'string' ? companyId : undefined,
      status: typeof status === 'string' ? status : undefined,
      search: typeof search === 'string' ? search : undefined,
    });

    return res.status(200).json(bills);
  } catch (err: unknown) {
    console.error('[GetBills Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve bills.',
      statusCode: 500,
    });
  }
};

/**
 * GET /api/bills/summary
 * Dashboard metrics for Home Screen cards.
 */
export const getBillsSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
        statusCode: 401,
      });
    }

    const summary = await billService.getBillsSummary(userId);
    return res.status(200).json(summary);
  } catch (err: unknown) {
    console.error('[GetBillsSummary Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to calculate dashboard summary.',
      statusCode: 500,
    });
  }
};

/**
 * GET /api/bills/:id
 * Retrieves a single bill by ID with verified broker ownership.
 */
export const getBillById = async (req: Request, res: Response) => {
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
    const bill = await billService.getBillById(id, userId);

    return res.status(200).json(bill);
  } catch (err: unknown) {
    if (err instanceof BillError) {
      return res.status(err.statusCode).json({
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[GetBillById Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve bill details.',
      statusCode: 500,
    });
  }
};

/**
 * POST /api/bills
 * Creates a new consignment sales bill with auto-calculated Dalali brokerage.
 */
export const createBill = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
        statusCode: 401,
      });
    }

    const parseResult = createBillSchema.safeParse(req.body);
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

    const bill = await billService.createBill(userId, parseResult.data);
    return res.status(201).json(bill);
  } catch (err: unknown) {
    if (err instanceof BillError) {
      return res.status(err.statusCode).json({
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[CreateBill Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create bill.',
      statusCode: 500,
    });
  }
};

/**
 * PUT /api/bills/:id
 * Updates an existing consignment sales bill.
 */
export const updateBill = async (req: Request, res: Response) => {
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
    const parseResult = updateBillSchema.safeParse(req.body);
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

    const updated = await billService.updateBill(id, userId, parseResult.data);
    return res.status(200).json(updated);
  } catch (err: unknown) {
    if (err instanceof BillError) {
      return res.status(err.statusCode).json({
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[UpdateBill Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update bill.',
      statusCode: 500,
    });
  }
};

/**
 * DELETE /api/bills/:id
 * Deletes a bill with verified broker ownership.
 */
export const deleteBill = async (req: Request, res: Response) => {
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
    const result = await billService.deleteBill(id, userId);

    return res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof BillError) {
      return res.status(err.statusCode).json({
        error: err.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[DeleteBill Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete bill.',
      statusCode: 500,
    });
  }
};

/**
 * DELETE /api/bills/company/:companyId
 * Deletes all bills associated with a given company for the authenticated broker.
 */
export const deleteBillsByCompany = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
        statusCode: 401,
      });
    }

    const companyId = req.params.companyId as string;
    const result = await billService.deleteBillsByCompany(companyId, userId);

    return res.status(200).json(result);
  } catch (err: unknown) {
    console.error('[DeleteBillsByCompany Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete company bills.',
      statusCode: 500,
    });
  }
};
