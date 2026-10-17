import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

// Validation schema for creating a company
const createCompanySchema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters'),
  contactNumber: z.string().trim().min(1, 'Contact number is required'),
  ownerName: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  gstin: z.string().trim().max(15, 'GSTIN cannot exceed 15 characters').optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
});

// Validation schema for updating a company
const updateCompanySchema = createCompanySchema.partial();

/**
 * GET /api/companies
 * Retrieves all registered buyer firms for the authenticated broker.
 * Supports optional ?search= query parameter matching name, ownerName, contactNumber, or GSTIN.
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

    return res.status(200).json(
      companies.map(c => ({
        id: c.id,
        name: c.name,
        ownerName: c.ownerName ?? undefined,
        contactNumber: c.contactNumber,
        email: c.email ?? undefined,
        gstin: c.gstin ?? undefined,
        address: c.address ?? undefined,
        notes: c.notes ?? undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
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

    const company = await prisma.company.findFirst({
      where: { id, userId },
    });

    if (!company) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Company not found or access unauthorized.',
        statusCode: 404,
      });
    }

    const billsCount = await prisma.bill.count({
      where: { companyId: id, userId },
    });

    return res.status(200).json({
      id: company.id,
      name: company.name,
      ownerName: company.ownerName ?? undefined,
      contactNumber: company.contactNumber,
      email: company.email ?? undefined,
      gstin: company.gstin ?? undefined,
      address: company.address ?? undefined,
      notes: company.notes ?? undefined,
      billsCount,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    });
  } catch (err) {
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

    const { name, contactNumber, ownerName, email, gstin, address, notes } = parseResult.data;

    const company = await prisma.company.create({
      data: {
        userId,
        name: name.trim(),
        contactNumber: contactNumber.trim(),
        ownerName: ownerName?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        gstin: gstin?.trim().toUpperCase() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return res.status(201).json({
      id: company.id,
      name: company.name,
      ownerName: company.ownerName ?? undefined,
      contactNumber: company.contactNumber,
      email: company.email ?? undefined,
      gstin: company.gstin ?? undefined,
      address: company.address ?? undefined,
      notes: company.notes ?? undefined,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    });
  } catch (err) {
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
 * Updates an existing company with verified broker ownership.
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

    // Verify ownership first
    const existing = await prisma.company.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Company not found or access unauthorized.',
        statusCode: 404,
      });
    }

    const parseResult = updateCompanySchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return res.status(400).json({
        error: 'Bad Request',
        message: firstIssue.message,
        statusCode: 400,
      });
    }

    const data = parseResult.data;
    const newName = data.name !== undefined ? data.name.trim() : existing.name;

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name: newName,
        contactNumber: data.contactNumber !== undefined ? data.contactNumber.trim() : existing.contactNumber,
        ownerName: data.ownerName !== undefined ? (data.ownerName?.trim() || null) : existing.ownerName,
        email: data.email !== undefined ? (data.email?.trim().toLowerCase() || null) : existing.email,
        gstin: data.gstin !== undefined ? (data.gstin?.trim().toUpperCase() || null) : existing.gstin,
        address: data.address !== undefined ? (data.address?.trim() || null) : existing.address,
        notes: data.notes !== undefined ? (data.notes?.trim() || null) : existing.notes,
      },
    });

    // If company name was updated, synchronize denormalized companyName on associated bills
    if (data.name !== undefined && data.name.trim() !== existing.name) {
      await prisma.bill.updateMany({
        where: { companyId: id },
        data: { companyName: newName },
      }).catch(err => console.error('[Bill CompanyName Sync Error]', err));
    }

    return res.status(200).json({
      id: updated.id,
      name: updated.name,
      ownerName: updated.ownerName ?? undefined,
      contactNumber: updated.contactNumber,
      email: updated.email ?? undefined,
      gstin: updated.gstin ?? undefined,
      address: updated.address ?? undefined,
      notes: updated.notes ?? undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
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
 * Deletes a company and cascades deletion to associated bills with verified ownership.
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

    // Verify ownership
    const existing = await prisma.company.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Company not found or access unauthorized.',
        statusCode: 404,
      });
    }

    await prisma.company.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Company and associated bills deleted successfully',
    });
  } catch (err) {
    console.error('[DeleteCompany Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete company.',
      statusCode: 500,
    });
  }
};
