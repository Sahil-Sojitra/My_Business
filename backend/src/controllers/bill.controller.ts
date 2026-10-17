import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, BillStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';

// Attachment metadata schema
const attachmentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['pdf', 'photo']),
  size: z.string().optional(),
  date: z.string().optional(),
  uri: z.string().optional(),
  url: z.string().optional(),
}).nullable().optional();

// Validation schema for creating a bill
const createBillSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
  companyName: z.string().optional(),
  billNumber: z.string().trim().optional().or(z.literal('')),
  amount: z.number().positive('Bill amount must be greater than zero'),
  dalaliRate: z.number().min(0, 'Dalali rate cannot be negative').default(1.5),
  dalaliAmount: z.number().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format').optional().or(z.literal('')),
  status: z.enum(['PENDING', 'OVERDUE', 'PARTIAL', 'PAID']).default('PENDING'),
  description: z.string().trim().optional().or(z.literal('')),
  billPdf: attachmentSchema,
  chitthi: attachmentSchema,
});

// Validation schema for updating a bill
const updateBillSchema = createBillSchema.partial();

// Helper to format a Prisma Bill record to frontend contract
const formatBillResponse = (b: any) => ({
  id: b.id,
  companyId: b.companyId,
  companyName: b.companyName,
  billNumber: b.billNumber ?? undefined,
  amount: Number(b.amount),
  dalaliRate: Number(b.dalaliRate),
  dalaliAmount: Number(b.dalaliAmount),
  // Kept for backward compatibility with existing frontend screens
  monthlyInterestRate: Number(b.dalaliRate),
  interestRate: Number(b.dalaliRate) * 12,
  date: b.date,
  dueDate: b.dueDate ?? undefined,
  status: b.status,
  description: b.description ?? undefined,
  billPdf: b.billPdf ?? null,
  chitthi: b.chitthi ?? null,
  createdAt: b.createdAt.toISOString(),
  updatedAt: b.updatedAt.toISOString(),
});

/**
 * GET /api/bills
 * Retrieves all sales bills for the authenticated broker.
 * Query params: ?companyId=..., ?status=..., ?search=...
 * Sorting: Nearest due date first (dueDate ASC NULLS LAST, date DESC)
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

    const whereClause: Prisma.BillWhereInput = { userId };

    if (typeof companyId === 'string' && companyId.trim()) {
      whereClause.companyId = companyId.trim();
    }

    if (typeof status === 'string' && status.trim() && status !== 'ALL') {
      whereClause.status = status.trim() as BillStatus;
    }

    if (typeof search === 'string' && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { billNumber: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Sort by nearest due date first, then newest invoice date
    const bills = await prisma.bill.findMany({
      where: whereClause,
      orderBy: [
        { dueDate: 'asc' },
        { date: 'desc' },
      ],
    });

    return res.status(200).json(bills.map(formatBillResponse));
  } catch (err) {
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
 * Aggregates active turnover, Dalali receivable, and status counts for the authenticated broker.
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

    // Fetch all bills for the authenticated broker to compute precise metrics
    const bills = await prisma.bill.findMany({
      where: { userId },
      select: {
        amount: true,
        dalaliAmount: true,
        status: true,
      },
    });

    let totalBillTurnover = 0;
    let totalDalaliReceivable = 0;
    let activeBillsCount = 0;
    let pendingBillsCount = 0;
    let overdueBillsCount = 0;
    let settledBillsCount = 0;

    for (const b of bills) {
      const amt = Number(b.amount);
      const dalali = Number(b.dalaliAmount);

      if (b.status === 'PAID') {
        settledBillsCount += 1;
      } else {
        // Active bills are all non-PAID bills
        activeBillsCount += 1;
        totalBillTurnover += amt;
        totalDalaliReceivable += dalali;

        if (b.status === 'PENDING') {
          pendingBillsCount += 1;
        } else if (b.status === 'OVERDUE') {
          overdueBillsCount += 1;
        }
      }
    }

    return res.status(200).json({
      totalBillTurnover: Math.round(totalBillTurnover * 100) / 100,
      totalDalaliReceivable: Math.round(totalDalaliReceivable * 100) / 100,
      activeBillsCount,
      pendingBillsCount,
      overdueBillsCount,
      settledBillsCount,
    });
  } catch (err) {
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

    const bill = await prisma.bill.findFirst({
      where: { id, userId },
    });

    if (!bill) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Bill not found or access unauthorized.',
        statusCode: 404,
      });
    }

    return res.status(200).json(formatBillResponse(bill));
  } catch (err) {
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

    const data = parseResult.data;

    // Validate that the target company exists and belongs to the authenticated broker
    const company = await prisma.company.findFirst({
      where: { id: data.companyId, userId },
    });

    if (!company) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Selected company does not exist or access is unauthorized.',
        statusCode: 400,
      });
    }

    // Static Dalali Formula: Dalali = (amount * dalaliRate) / 100
    const dalaliRate = data.dalaliRate ?? 1.5;
    const computedDalaliAmount =
      data.dalaliAmount !== undefined && !isNaN(data.dalaliAmount)
        ? data.dalaliAmount
        : Math.round(((data.amount * dalaliRate) / 100) * 100) / 100;

    const bill = await prisma.bill.create({
      data: {
        userId,
        companyId: company.id,
        companyName: company.name,
        billNumber: data.billNumber?.trim() || null,
        amount: new Prisma.Decimal(data.amount.toFixed(2)),
        dalaliRate: new Prisma.Decimal(dalaliRate.toFixed(2)),
        dalaliAmount: new Prisma.Decimal(computedDalaliAmount.toFixed(2)),
        date: data.date,
        dueDate: data.dueDate?.trim() || null,
        status: data.status,
        description: data.description?.trim() || null,
        billPdf: data.billPdf ? (data.billPdf as Prisma.InputJsonValue) : Prisma.JsonNull,
        chitthi: data.chitthi ? (data.chitthi as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    return res.status(201).json(formatBillResponse(bill));
  } catch (err) {
    console.error('[CreateBill Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to record bill.',
      statusCode: 500,
    });
  }
};

/**
 * PUT /api/bills/:id
 * Updates an existing bill with verified broker ownership.
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

    // Verify ownership
    const existing = await prisma.bill.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Bill not found or access unauthorized.',
        statusCode: 404,
      });
    }

    const parseResult = updateBillSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return res.status(400).json({
        error: 'Bad Request',
        message: firstIssue.message,
        statusCode: 400,
      });
    }

    const data = parseResult.data;

    let companyName = existing.companyName;
    if (data.companyId && data.companyId !== existing.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: data.companyId, userId },
      });
      if (!company) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Selected company does not exist or access is unauthorized.',
          statusCode: 400,
        });
      }
      companyName = company.name;
    }

    const finalAmount = data.amount !== undefined ? data.amount : Number(existing.amount);
    const finalDalaliRate = data.dalaliRate !== undefined ? data.dalaliRate : Number(existing.dalaliRate);
    const finalDalaliAmount =
      data.dalaliAmount !== undefined
        ? data.dalaliAmount
        : Math.round(((finalAmount * finalDalaliRate) / 100) * 100) / 100;

    const updated = await prisma.bill.update({
      where: { id },
      data: {
        companyId: data.companyId ?? existing.companyId,
        companyName,
        billNumber: data.billNumber !== undefined ? (data.billNumber.trim() || null) : existing.billNumber,
        amount: new Prisma.Decimal(finalAmount.toFixed(2)),
        dalaliRate: new Prisma.Decimal(finalDalaliRate.toFixed(2)),
        dalaliAmount: new Prisma.Decimal(finalDalaliAmount.toFixed(2)),
        date: data.date ?? existing.date,
        dueDate: data.dueDate !== undefined ? (data.dueDate?.trim() || null) : existing.dueDate,
        status: data.status ?? existing.status,
        description: data.description !== undefined ? (data.description?.trim() || null) : existing.description,
        billPdf: data.billPdf !== undefined ? (data.billPdf ? (data.billPdf as Prisma.InputJsonValue) : Prisma.JsonNull) : undefined,
        chitthi: data.chitthi !== undefined ? (data.chitthi ? (data.chitthi as Prisma.InputJsonValue) : Prisma.JsonNull) : undefined,
      },
    });

    return res.status(200).json(formatBillResponse(updated));
  } catch (err) {
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

    const existing = await prisma.bill.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Bill not found or access unauthorized.',
        statusCode: 404,
      });
    }

    await prisma.bill.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Bill deleted successfully',
    });
  } catch (err) {
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

    const result = await prisma.bill.deleteMany({
      where: { companyId, userId },
    });

    return res.status(200).json({
      success: true,
      count: result.count,
    });
  } catch (err) {
    console.error('[DeleteBillsByCompany Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete company bills.',
      statusCode: 500,
    });
  }
};
