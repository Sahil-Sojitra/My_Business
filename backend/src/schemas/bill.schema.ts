import { z } from 'zod';

/**
 * Attachment metadata schema (stored as JSON)
 */
export const attachmentSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(['pdf', 'photo']),
    size: z.string().optional(),
    date: z.string().optional(),
    uri: z.string().optional(),
    url: z.string().optional(),
  })
  .nullable()
  .optional();

export type AttachmentInput = z.infer<typeof attachmentSchema>;

/**
 * Validation schema for creating a consignment sales bill
 */
export const createBillSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
  companyName: z.string().optional(),
  billNumber: z.string().trim().optional().or(z.literal('')),
  amount: z.number().positive('Bill amount must be greater than zero'),
  dalaliRate: z.number().min(0, 'Dalali rate cannot be negative').default(1.5),
  dalaliAmount: z.number().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
  status: z.enum(['PENDING', 'OVERDUE', 'PARTIAL', 'PAID']).default('PENDING'),
  description: z.string().trim().optional().or(z.literal('')),
  billPdf: attachmentSchema,
  chitthi: attachmentSchema,
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

/**
 * Validation schema for updating a bill (all fields optional)
 */
export const updateBillSchema = createBillSchema.partial();

export type UpdateBillInput = z.infer<typeof updateBillSchema>;
