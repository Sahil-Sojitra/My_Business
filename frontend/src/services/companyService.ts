import {
  Company,
  CreateCompanyInput,
  UpdateCompanyInput,
} from '../types/company';
import { request, ApiError } from './apiClient';

export interface ICompanyService {
  getAll(): Promise<Company[]>;
  getById(id: string): Promise<Company | null>;
  create(data: CreateCompanyInput): Promise<Company>;
  update(id: string, data: UpdateCompanyInput): Promise<Company>;
  delete(id: string): Promise<boolean>;
}

/**
 * Real API client implementation of ICompanyService connected to backend /api/companies endpoints.
 * Note: Searching is deliberately performed client-side on the frontend for instantaneous results.
 */
class RealCompanyService implements ICompanyService {
  async getAll(): Promise<Company[]> {
    return request<Company[]>('/companies');
  }

  async getById(id: string): Promise<Company | null> {
    try {
      return await request<Company>(`/companies/${id}`);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async create(data: CreateCompanyInput): Promise<Company> {
    return request<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name.trim(),
        contactNumber: data.contactNumber.trim(),
        ownerName: data.ownerName?.trim() || undefined,
        email: data.email?.trim() || undefined,
        gstin: data.gstin?.trim() || undefined,
        address: data.address?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      }),
    });
  }

  async update(id: string, data: UpdateCompanyInput): Promise<Company> {
    return request<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name !== undefined ? data.name.trim() : undefined,
        contactNumber:
          data.contactNumber !== undefined
            ? data.contactNumber.trim()
            : undefined,
        ownerName:
          data.ownerName !== undefined ? data.ownerName.trim() : undefined,
        email: data.email !== undefined ? data.email.trim() : undefined,
        gstin: data.gstin !== undefined ? data.gstin.trim() : undefined,
        address: data.address !== undefined ? data.address.trim() : undefined,
        notes: data.notes !== undefined ? data.notes.trim() : undefined,
      }),
    });
  }

  async delete(id: string): Promise<boolean> {
    await request<{ success: boolean }>(`/companies/${id}`, {
      method: 'DELETE',
    });
    return true;
  }
}

export const companyService: ICompanyService = new RealCompanyService();
