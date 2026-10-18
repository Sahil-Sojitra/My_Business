import {
  CreateBillInput,
  Transaction,
  UpdateBillInput,
} from '../types/transaction';
import { request, ApiError } from './apiClient';

export interface ITransactionService {
  getAll(companyId?: string): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  create(data: CreateBillInput): Promise<Transaction>;
  update(id: string, data: UpdateBillInput): Promise<Transaction>;
  delete(id: string): Promise<boolean>;
  deleteByCompanyId(companyId: string): Promise<number>;
}

/**
 * Real API client implementation of ITransactionService connected to backend /api/bills endpoints.
 * Note: Searching is handled client-side on the frontend for zero-latency instant filtering.
 */
class RealTransactionService implements ITransactionService {
  async getAll(companyId?: string): Promise<Transaction[]> {
    const endpoint = companyId
      ? `/bills?companyId=${encodeURIComponent(companyId)}`
      : '/bills';
    return request<Transaction[]>(endpoint);
  }

  async getById(id: string): Promise<Transaction | null> {
    try {
      return await request<Transaction>(`/bills/${id}`);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async create(data: CreateBillInput): Promise<Transaction> {
    const body: Record<string, unknown> = {
      companyId: data.companyId,
      companyName: data.companyName,
      billNumber: data.billNumber?.trim() || undefined,
      amount: Number(data.amount),
      dalaliRate:
        data.dalaliRate !== undefined ? Number(data.dalaliRate) : 1.5,
      date: data.date,
      status: data.status || 'PENDING',
    };

    if (data.dalaliAmount !== undefined) {
      body.dalaliAmount = Number(data.dalaliAmount);
    }
    if (data.dueDate && data.dueDate.trim()) {
      body.dueDate = data.dueDate.trim();
    }
    if (data.description && data.description.trim()) {
      body.description = data.description.trim();
    }
    if (data.billPdf) {
      body.billPdf = data.billPdf;
    }
    if (data.chitthi) {
      body.chitthi = data.chitthi;
    }

    return request<Transaction>('/bills', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async update(id: string, data: UpdateBillInput): Promise<Transaction> {
    const body: Record<string, unknown> = {};

    if (data.companyId !== undefined) {
      body.companyId = data.companyId;
    }
    if (data.companyName !== undefined) {
      body.companyName = data.companyName;
    }
    if (data.billNumber !== undefined) {
      body.billNumber = data.billNumber.trim();
    }
    if (data.amount !== undefined) {
      body.amount = Number(data.amount);
    }
    if (data.dalaliRate !== undefined) {
      body.dalaliRate = Number(data.dalaliRate);
    }
    if (data.dalaliAmount !== undefined) {
      body.dalaliAmount = Number(data.dalaliAmount);
    }
    if (data.date !== undefined) {
      body.date = data.date;
    }
    if (data.dueDate !== undefined) {
      body.dueDate = data.dueDate.trim();
    }
    if (data.status !== undefined) {
      body.status = data.status;
    }
    if (data.description !== undefined) {
      body.description = data.description.trim();
    }
    if (data.billPdf !== undefined) {
      body.billPdf = data.billPdf;
    }
    if (data.chitthi !== undefined) {
      body.chitthi = data.chitthi;
    }

    return request<Transaction>(`/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(id: string): Promise<boolean> {
    await request<{ success: boolean }>(`/bills/${id}`, {
      method: 'DELETE',
    });
    return true;
  }

  async deleteByCompanyId(companyId: string): Promise<number> {
    const res = await request<{ success: boolean; count: number }>(
      `/bills/company/${encodeURIComponent(companyId)}`,
      {
        method: 'DELETE',
      }
    );
    return res.count ?? 0;
  }
}

export const transactionService: ITransactionService =
  new RealTransactionService();
