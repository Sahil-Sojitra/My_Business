import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { CreateCompanyInput, UpdateCompanyInput } from '../schemas/company.schema.js';

export class CompanyError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'CompanyError';
    this.statusCode = statusCode;
  }
}

const formatCompanyResponse = (c: any) => ({
  id: c.id,
  name: c.name,
  ownerName: c.ownerName ?? undefined,
  contactNumber: c.contactNumber,
  email: c.email ?? undefined,
  gstin: c.gstin ?? undefined,
  address: c.address ?? undefined,
  notes: c.notes ?? undefined,
  billsCount: c.billsCount !== undefined ? c.billsCount : undefined,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

/**
 * Service encapsulating company database queries and business logic
 */
export const companyService = {
  async getCompanies(userId: string, search?: string) {
    const whereClause: Prisma.CompanyWhereInput = { userId };

    if (typeof search === 'string' && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { ownerName: { contains: q, mode: 'insensitive' } },
        { contactNumber: { contains: q, mode: 'insensitive' } },
        { gstin: { contains: q, mode: 'insensitive' } },
      ];
    }

    const companies = await prisma.company.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    return companies.map(formatCompanyResponse);
  },

  async getCompanyById(companyId: string, userId: string) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      throw new CompanyError('Company not found or access unauthorized.', 404);
    }

    const billsCount = await prisma.bill.count({
      where: { companyId, userId },
    });

    return {
      ...formatCompanyResponse(company),
      billsCount,
    };
  },

  async createCompany(userId: string, data: CreateCompanyInput) {
    const company = await prisma.company.create({
      data: {
        userId,
        name: data.name.trim(),
        contactNumber: data.contactNumber.trim(),
        ownerName: data.ownerName?.trim() || null,
        email: data.email?.trim().toLowerCase() || null,
        gstin: data.gstin?.trim().toUpperCase() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    return formatCompanyResponse(company);
  },

  async updateCompany(
    companyId: string,
    userId: string,
    data: UpdateCompanyInput
  ) {
    const existing = await prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!existing) {
      throw new CompanyError('Company not found or access unauthorized.', 404);
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name !== undefined ? data.name.trim() : existing.name,
        contactNumber:
          data.contactNumber !== undefined
            ? data.contactNumber.trim()
            : existing.contactNumber,
        ownerName:
          data.ownerName !== undefined
            ? data.ownerName?.trim() || null
            : existing.ownerName,
        email:
          data.email !== undefined
            ? data.email?.trim().toLowerCase() || null
            : existing.email,
        gstin:
          data.gstin !== undefined
            ? data.gstin?.trim().toUpperCase() || null
            : existing.gstin,
        address:
          data.address !== undefined
            ? data.address?.trim() || null
            : existing.address,
        notes:
          data.notes !== undefined
            ? data.notes?.trim() || null
            : existing.notes,
      },
    });

    return formatCompanyResponse(updated);
  },

  async deleteCompany(companyId: string, userId: string) {
    const existing = await prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!existing) {
      throw new CompanyError('Company not found or access unauthorized.', 404);
    }

    await prisma.company.delete({
      where: { id: companyId },
    });

    return { success: true, message: 'Company deleted successfully' };
  },
};
