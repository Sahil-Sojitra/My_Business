import { Prisma, BillStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { CreateBillInput, UpdateBillInput } from '../schemas/bill.schema.js';
import { storageService, extractAttachmentKeys } from './storage.service.js';

export class BillError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'BillError';
    this.statusCode = statusCode;
  }
}

/**
 * Format Prisma Bill record to frontend contract
 */
export const formatBillResponse = (b: any) => ({
  id: b.id,
  companyId: b.companyId,
  companyName: b.companyName,
  billNumber: b.billNumber ?? undefined,
  amount: Number(b.amount),
  dalaliRate: Number(b.dalaliRate),
  dalaliAmount: Number(b.dalaliAmount),
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
 * Service encapsulating consignment sales bills database access and calculations
 */
export const billService = {
  async getBills(
    userId: string,
    filters: { companyId?: string; status?: string; search?: string }
  ) {
    const today = new Date().toISOString().split('T')[0];
    try {
      // Auto-transition bills past due date from PENDING to OVERDUE
      await prisma.bill.updateMany({
        where: {
          userId,
          status: 'PENDING',
          dueDate: { lt: today, not: null },
        },
        data: {
          status: 'OVERDUE',
        },
      });
      // In case an overdue bill's due date was extended, transition back to PENDING
      await prisma.bill.updateMany({
        where: {
          userId,
          status: 'OVERDUE',
          dueDate: { gte: today, not: null },
        },
        data: {
          status: 'PENDING',
        },
      });
    } catch (err: unknown) {
      console.warn('[AutoOverdue Check Warning]', err instanceof Error ? err.message : err);
    }

    const whereClause: Prisma.BillWhereInput = { userId };

    if (filters.companyId && filters.companyId.trim()) {
      whereClause.companyId = filters.companyId.trim();
    }

    if (
      filters.status &&
      filters.status.trim() &&
      filters.status !== 'ALL'
    ) {
      whereClause.status = filters.status.trim() as BillStatus;
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      whereClause.OR = [
        { billNumber: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const bills = await prisma.bill.findMany({
      where: whereClause,
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { date: 'desc' }],
    });

    return bills.map(formatBillResponse);
  },

  async getBillsSummary(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    try {
      await prisma.bill.updateMany({
        where: {
          userId,
          status: 'PENDING',
          dueDate: { lt: today, not: null },
        },
        data: {
          status: 'OVERDUE',
        },
      });
      await prisma.bill.updateMany({
        where: {
          userId,
          status: 'OVERDUE',
          dueDate: { gte: today, not: null },
        },
        data: {
          status: 'PENDING',
        },
      });
    } catch (err: unknown) {
      console.warn('[AutoOverdue Summary Check Warning]', err instanceof Error ? err.message : err);
    }

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
    let outstandingBillsCount = 0;
    let settledBillsCount = 0;

    for (const b of bills) {
      const amt = Number(b.amount);
      const dalali = Number(b.dalaliAmount);

      if (b.status === 'PAID') {
        settledBillsCount += 1;
      } else {
        activeBillsCount += 1;
        totalBillTurnover += amt;
        totalDalaliReceivable += dalali;

        if (b.status === 'PENDING') {
          pendingBillsCount += 1;
        } else if (b.status === 'OVERDUE') {
          overdueBillsCount += 1;
        } else if ((b.status as string) === 'OUTSTANDING') {
          outstandingBillsCount += 1;
        }
      }
    }

    return {
      totalBillTurnover: Math.round(totalBillTurnover * 100) / 100,
      totalDalaliReceivable: Math.round(totalDalaliReceivable * 100) / 100,
      activeBillsCount,
      pendingBillsCount,
      overdueBillsCount,
      outstandingBillsCount,
      settledBillsCount,
    };
  },

  async getBillById(billId: string, userId: string) {
    const bill = await prisma.bill.findFirst({
      where: { id: billId, userId },
    });

    if (!bill) {
      throw new BillError('Bill not found or access unauthorized.', 404);
    }

    return formatBillResponse(bill);
  },

  async createBill(userId: string, data: CreateBillInput) {
    let companyName = data.companyName;

    if (!companyName) {
      const company = await prisma.company.findFirst({
        where: { id: data.companyId, userId },
      });

      if (!company) {
        throw new BillError(
          'Selected company does not exist or access is unauthorized.',
          400
        );
      }
      companyName = company.name;
    }

    const calculatedDalaliAmount =
      data.dalaliAmount !== undefined
        ? data.dalaliAmount
        : Math.round(((data.amount * data.dalaliRate) / 100) * 100) / 100;

    const bill = await prisma.bill.create({
      data: {
        userId,
        companyId: data.companyId,
        companyName,
        billNumber: data.billNumber?.trim() || null,
        amount: new Prisma.Decimal(data.amount.toFixed(2)),
        dalaliRate: new Prisma.Decimal(data.dalaliRate.toFixed(2)),
        dalaliAmount: new Prisma.Decimal(calculatedDalaliAmount.toFixed(2)),
        date: data.date,
        dueDate: data.dueDate?.trim() || null,
        status: data.status as BillStatus,
        description: data.description?.trim() || null,
        billPdf: data.billPdf
          ? (data.billPdf as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        chitthi: data.chitthi
          ? (data.chitthi as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    return formatBillResponse(bill);
  },

  async updateBill(
    billId: string,
    userId: string,
    data: UpdateBillInput
  ) {
    const existing = await prisma.bill.findFirst({
      where: { id: billId, userId },
    });

    if (!existing) {
      throw new BillError('Bill not found or access unauthorized.', 404);
    }

    let companyName = existing.companyName;
    if (data.companyId && data.companyId !== existing.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: data.companyId, userId },
      });
      if (!company) {
        throw new BillError(
          'Selected company does not exist or access is unauthorized.',
          400
        );
      }
      companyName = company.name;
    }

    const finalAmount =
      data.amount !== undefined ? data.amount : Number(existing.amount);
    const finalDalaliRate =
      data.dalaliRate !== undefined
        ? data.dalaliRate
        : Number(existing.dalaliRate);
    const finalDalaliAmount =
      data.dalaliAmount !== undefined
        ? data.dalaliAmount
        : Math.round(((finalAmount * finalDalaliRate) / 100) * 100) / 100;

    const updated = await prisma.bill.update({
      where: { id: billId },
      data: {
        companyId: data.companyId ?? existing.companyId,
        companyName,
        billNumber:
          data.billNumber !== undefined
            ? data.billNumber.trim() || null
            : existing.billNumber,
        amount: new Prisma.Decimal(finalAmount.toFixed(2)),
        dalaliRate: new Prisma.Decimal(finalDalaliRate.toFixed(2)),
        dalaliAmount: new Prisma.Decimal(finalDalaliAmount.toFixed(2)),
        date: data.date ?? existing.date,
        dueDate:
          data.dueDate !== undefined
            ? data.dueDate?.trim() || null
            : existing.dueDate,
        status: (data.status as BillStatus) ?? existing.status,
        description:
          data.description !== undefined
            ? data.description?.trim() || null
            : existing.description,
        billPdf:
          data.billPdf !== undefined
            ? data.billPdf
              ? (data.billPdf as Prisma.InputJsonValue)
              : Prisma.JsonNull
            : undefined,
        chitthi:
          data.chitthi !== undefined
            ? data.chitthi
              ? (data.chitthi as Prisma.InputJsonValue)
              : Prisma.JsonNull
            : undefined,
      },
    });

    return formatBillResponse(updated);
  },

  async deleteBill(billId: string, userId: string) {
    const existing = await prisma.bill.findFirst({
      where: { id: billId, userId },
    });

    if (!existing) {
      throw new BillError('Bill not found or access unauthorized.', 404);
    }

    // 1. Extract cloud object keys before database deletion
    const attachmentKeys = extractAttachmentKeys(existing);

    // 2. Commit database record deletion first (ensures live bills never lose files on DB failure)
    await prisma.bill.delete({
      where: { id: billId },
    });

    // 3. Clean up associated Backblaze B2 cloud objects
    let cleanup = { total: 0, deleted: [] as string[], failed: [] as any[], skipped: [] as string[] };
    if (attachmentKeys.length > 0) {
      cleanup = await storageService.deleteObjects(attachmentKeys, userId, billId);
    }

    const hasFailures = cleanup.failed.length > 0;

    return {
      success: true,
      message: hasFailures
        ? 'Bill deleted successfully, but some cloud attachments could not be removed immediately and have been scheduled for retry.'
        : 'Bill deleted successfully',
      cleanup: {
        total: cleanup.total,
        deleted: cleanup.deleted.length,
        failed: cleanup.failed.length,
        skipped: cleanup.skipped.length,
      },
    };
  },

  async deleteBillsByCompany(companyId: string, userId: string) {
    // 1. Identify all attachments belonging to this company's bills
    const existingBills = await prisma.bill.findMany({
      where: { companyId, userId },
      select: { id: true, billPdf: true, chitthi: true },
    });

    const attachmentKeys: string[] = [];
    for (const b of existingBills) {
      attachmentKeys.push(...extractAttachmentKeys(b));
    }

    // 2. Commit database deletion
    const result = await prisma.bill.deleteMany({
      where: { companyId, userId },
    });

    // 3. Clean up cloud objects
    let cleanup = { total: 0, deleted: [] as string[], failed: [] as any[], skipped: [] as string[] };
    if (attachmentKeys.length > 0) {
      cleanup = await storageService.deleteObjects(attachmentKeys, userId);
    }

    return {
      success: true,
      count: result.count,
      cleanup: {
        total: cleanup.total,
        deleted: cleanup.deleted.length,
        failed: cleanup.failed.length,
        skipped: cleanup.skipped.length,
      },
    };
  },
};

