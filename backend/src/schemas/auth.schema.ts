import { z } from 'zod';

/**
 * Validation schema for broker registration
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    mobileNumber: z.string().optional(),
    phone: z.string().optional(),
    email: z
      .string()
      .trim()
      .email('Invalid email address format')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    businessName: z.string().trim().optional(),
  })
  .refine(data => Boolean(data.mobileNumber || data.phone), {
    message: 'Mobile number is required for registration',
    path: ['mobileNumber'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Validation schema for broker login
 */
export const loginSchema = z
  .object({
    mobileNumber: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine(data => Boolean(data.mobileNumber || data.phone || data.email), {
    message: 'Mobile number is required for sign in',
    path: ['mobileNumber'],
  });

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validation schema for updating user profile
 */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  mobileNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .trim()
    .email('Invalid email address format')
    .optional()
    .or(z.literal('')),
  businessName: z.string().trim().optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Validation schema for account deletion
 */
export const deleteAccountSchema = z.object({
  password: z.string().optional(),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
