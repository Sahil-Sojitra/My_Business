import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { normalizeMobileNumber, isValidMobileNumber } from '../utils/phone.js';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from '../schemas/auth.schema.js';
import { storageService, extractAttachmentKeys } from './storage.service.js';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'my_business_super_secret_jwt_key_2026_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthResult {
  user: {
    id: string;
    name: string;
    mobileNumber: string;
    phone: string;
    email: string | null;
    businessName: string | null;
    createdAt: string;
  };
  token: string;
}

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Service encapsulating broker authentication and JWT token lifecycle
 */
export const authService = {
  generateToken(payload: {
    userId: string;
    mobileNumber: string;
    name: string;
    email: string | null;
    businessName: string | null;
  }): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  },

  async registerUser(data: RegisterInput): Promise<AuthResult> {
    const rawMobile = data.mobileNumber || data.phone || '';
    const normalizedMobile = normalizeMobileNumber(rawMobile);

    if (!isValidMobileNumber(normalizedMobile)) {
      throw new AuthError('Please provide a valid 10-digit mobile number', 400);
    }

    const normalizedEmail = (data.email || '').trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new AuthError('Please provide a valid email address', 400);
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { mobileNumber: normalizedMobile },
          { email: normalizedEmail },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.mobileNumber === normalizedMobile) {
        throw new AuthError(
          'An account with this mobile number already exists. Please sign in.',
          409
        );
      }
      throw new AuthError(
        'An account with this email address already exists. Please sign in or use another email.',
        409
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        mobileNumber: normalizedMobile,
        email: normalizedEmail,
        passwordHash,
        businessName: data.businessName?.trim() || 'My Business',
      },
    });

    const token = this.generateToken({
      userId: user.id,
      mobileNumber: user.mobileNumber,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        phone: user.mobileNumber,
        email: user.email,
        businessName: user.businessName,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    };
  },

  async loginUser(data: LoginInput): Promise<AuthResult> {
    const rawIdentifier =
      data.mobileNumber || data.phone || data.email || '';

    let user = null;
    const normalizedMobile = normalizeMobileNumber(rawIdentifier);

    if (isValidMobileNumber(normalizedMobile)) {
      user = await prisma.user.findUnique({
        where: { mobileNumber: normalizedMobile },
      });
    } else if (rawIdentifier.includes('@')) {
      user = await prisma.user.findFirst({
        where: { email: rawIdentifier.trim().toLowerCase() },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { mobileNumber: normalizedMobile },
      });
    }

    if (!user) {
      throw new AuthError('Invalid mobile number or password', 401);
    }

    const passwordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordValid) {
      throw new AuthError('Invalid mobile number or password', 401);
    }

    const token = this.generateToken({
      userId: user.id,
      mobileNumber: user.mobileNumber,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        phone: user.mobileNumber,
        email: user.email,
        businessName: user.businessName,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    };
  },

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        mobileNumber: true,
        email: true,
        businessName: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AuthError('User profile not found', 404);
    }

    return {
      id: user.id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      phone: user.mobileNumber,
      email: user.email,
      businessName: user.businessName,
      createdAt: user.createdAt.toISOString(),
    };
  },

  async updateProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthError('User account not found', 404);
    }

    const updates: {
      name?: string;
      mobileNumber?: string;
      email?: string | null;
      businessName?: string;
      passwordHash?: string;
    } = {};

    if (data.name !== undefined && data.name.trim().length >= 2) {
      updates.name = data.name.trim();
    }

    if (data.businessName !== undefined) {
      updates.businessName = data.businessName.trim() || 'My Business';
    }

    if (data.email !== undefined) {
      updates.email = data.email ? data.email.trim().toLowerCase() : null;
    }

    const rawMobile = data.mobileNumber || data.phone;
    if (rawMobile !== undefined && rawMobile.trim().length > 0) {
      const normalizedMobile = normalizeMobileNumber(rawMobile);
      if (!isValidMobileNumber(normalizedMobile)) {
        throw new AuthError('Please provide a valid 10-digit mobile number', 400);
      }

      if (normalizedMobile !== user.mobileNumber) {
        const existing = await prisma.user.findUnique({
          where: { mobileNumber: normalizedMobile },
        });
        if (existing && existing.id !== user.id) {
          throw new AuthError(
            'This mobile number is already registered to another account',
            409
          );
        }
        updates.mobileNumber = normalizedMobile;
      }
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new AuthError(
          'Current password is required to change your password',
          400
        );
      }
      const isPasswordValid = await bcrypt.compare(
        data.currentPassword,
        user.passwordHash
      );
      if (!isPasswordValid) {
        throw new AuthError('Current password is incorrect', 400);
      }
      updates.passwordHash = await bcrypt.hash(data.newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    const token = this.generateToken({
      userId: updatedUser.id,
      mobileNumber: updatedUser.mobileNumber,
      name: updatedUser.name,
      email: updatedUser.email,
      businessName: updatedUser.businessName,
    });

    return {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        mobileNumber: updatedUser.mobileNumber,
        phone: updatedUser.mobileNumber,
        email: updatedUser.email,
        businessName: updatedUser.businessName,
        createdAt: updatedUser.createdAt.toISOString(),
      },
      token,
    };
  },

  async deleteAccount(
    userId: string,
    password?: string
  ): Promise<{
    success: boolean;
    message: string;
    cleanup?: {
      total: number;
      deleted: number;
      failed: number;
      skipped: number;
    };
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthError('User account not found', 404);
    }

    if (password) {
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AuthError('Incorrect password provided for account deletion', 400);
      }
    }

    // 1. Identify all bill attachments for this user in paginated batches (bounded memory)
    const batchSize = 100;
    let skip = 0;
    const attachmentKeys: string[] = [];

    while (true) {
      const billsBatch = await prisma.bill.findMany({
        where: { userId },
        select: { billPdf: true, chitthi: true },
        skip,
        take: batchSize,
      });

      if (billsBatch.length === 0) {
        break;
      }

      for (const bill of billsBatch) {
        attachmentKeys.push(...extractAttachmentKeys(bill));
      }

      skip += batchSize;
    }

    // 2. Cascade delete user and all associated companies, bills, and data in an atomic transaction
    await prisma.$transaction([
      prisma.bill.deleteMany({ where: { userId } }),
      prisma.company.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    // 3. Clean up associated Backblaze B2 cloud objects
    let cleanup = { total: 0, deleted: [] as string[], failed: [] as any[], skipped: [] as string[] };
    if (attachmentKeys.length > 0) {
      cleanup = await storageService.deleteObjects(attachmentKeys, userId);
    }

    const hasFailures = cleanup.failed.length > 0;

    return {
      success: true,
      message: hasFailures
        ? 'Account deleted successfully, but some cloud attachments could not be removed immediately and have been scheduled for retry.'
        : 'Account and all associated business data permanently deleted.',
      cleanup: {
        total: cleanup.total,
        deleted: cleanup.deleted.length,
        failed: cleanup.failed.length,
        skipped: cleanup.skipped.length,
      },
    };
  },
};

