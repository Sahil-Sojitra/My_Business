import { z } from 'zod';

/**
 * Validation schema for creating a company
 */
export const createCompanySchema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters'),
  contactNumber: z.string().trim().min(1, 'Contact number is required'),
  ownerName: z.string().trim().optional().or(z.literal('')),
  gstin: z
    .string()
    .trim()
    .max(15, 'GSTIN cannot exceed 15 characters')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

/**
 * Validation schema for updating a company (all fields optional)
 */
export const updateCompanySchema = createCompanySchema.partial();

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
