import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { OtpPurpose } from '../types/auth.types.js';
import { normalizeMobileNumber, isValidMobileNumber } from '../utils/phone.js';
import { AuthError } from '../utils/errors.js';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  VerifyEmailInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../schemas/auth.schema.js';
import { storageService, extractAttachmentKeys } from './storage.service.js';
import { emailService } from './email.service.js';
import { otpService } from './otp.service.js';

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
    isEmailVerified: boolean;
    createdAt: string;
  };
  token: string;
}

export interface RegistrationResult {
  message: string;
  requiresVerification: boolean;
  email: string | null;
  user: {
    id: string;
    name: string;
    mobileNumber: string;
    phone: string;
    email: string | null;
    businessName: string | null;
    isEmailVerified: boolean;
    createdAt: string;
  };
}

export { AuthError } from '../utils/errors.js';

/**
 * Service encapsulating broker authentication, verification OTPs, and JWT token lifecycle
 */
export const authService = {
  generateToken(payload: {
    userId: string;
    mobileNumber: string;
    name: string;
    email: string | null;
    businessName: string | null;
    tokenVersion?: number;
  }): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  },

  /**
   * Registers a new broker, creates an unverified account, generates a 6-digit OTP,
   * and delivers it via Brevo transactional email.
   */
  async registerUser(data: RegisterInput): Promise<RegistrationResult> {
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

    // Create broker account initially unverified
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        mobileNumber: normalizedMobile,
        email: normalizedEmail,
        passwordHash,
        businessName: data.businessName?.trim() || 'My Business',
        isEmailVerified: false,
        tokenVersion: 1,
      },
    });

    // Generate and store OTP, then dispatch via Brevo
    let otpRecordId: string | null = null;
    try {
      const { otp, recordId } = await otpService.createAndStoreOtp({
        email: normalizedEmail,
        purpose: OtpPurpose.EMAIL_VERIFICATION,
        userId: user.id,
      });
      otpRecordId = recordId;

      await emailService.sendRegistrationOtp(normalizedEmail, user.name, otp);
    } catch (deliveryError: unknown) {
      // Rollback OTP and newly created user if initial email delivery fails
      if (otpRecordId) {
        await otpService.cleanupFailedDeliveryOtp(otpRecordId);
      }
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});

      const message =
        deliveryError instanceof Error
          ? deliveryError.message
          : 'Failed to deliver registration verification email. Please try again.';
      throw new AuthError(message, 502);
    }

    return {
      message:
        'Registration successful. Please enter the 6-digit verification code sent to your email address.',
      requiresVerification: true,
      email: user.email,
      user: {
        id: user.id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        phone: user.mobileNumber,
        email: user.email,
        businessName: user.businessName,
        isEmailVerified: false,
        createdAt: user.createdAt.toISOString(),
      },
    };
  },

  /**
   * Verifies registration email using submitted 6-digit OTP
   */
  async verifyEmail(data: VerifyEmailInput): Promise<AuthResult> {
    const normalizedEmail = data.email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AuthError('No account found with this email address.', 404);
    }

    if (user.isEmailVerified) {
      // Already verified, generate fresh token
      const token = this.generateToken({
        userId: user.id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        tokenVersion: user.tokenVersion,
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          mobileNumber: user.mobileNumber,
          phone: user.mobileNumber,
          email: user.email,
          businessName: user.businessName,
          isEmailVerified: true,
          createdAt: user.createdAt.toISOString(),
        },
        token,
      };
    }

    // Atomically verify OTP
    await otpService.verifyOtp({
      email: normalizedEmail,
      otp: data.otp,
      purpose: OtpPurpose.EMAIL_VERIFICATION,
    });

    // Mark user as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    const token = this.generateToken({
      userId: updatedUser.id,
      mobileNumber: updatedUser.mobileNumber,
      name: updatedUser.name,
      email: updatedUser.email,
      businessName: updatedUser.businessName,
      tokenVersion: updatedUser.tokenVersion,
    });

    return {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        mobileNumber: updatedUser.mobileNumber,
        phone: updatedUser.mobileNumber,
        email: updatedUser.email,
        businessName: updatedUser.businessName,
        isEmailVerified: true,
        createdAt: updatedUser.createdAt.toISOString(),
      },
      token,
    };
  },

  /**
   * Resends verification or reset OTP with cooldown enforcement
   */
  async resendOtp(
    data: ResendOtpInput
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const purpose =
      data.purpose === 'PASSWORD_RESET'
        ? OtpPurpose.PASSWORD_RESET
        : OtpPurpose.EMAIL_VERIFICATION;

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
      if (!user) {
        throw new AuthError('No account found with this email address.', 404);
      }
      if (user.isEmailVerified) {
        throw new AuthError(
          'This email address has already been verified. Please sign in.',
          400
        );
      }

      let otpRecordId: string | null = null;
      try {
        const { otp, recordId } = await otpService.createAndStoreOtp({
          email: normalizedEmail,
          purpose: OtpPurpose.EMAIL_VERIFICATION,
          userId: user.id,
        });
        otpRecordId = recordId;

        await emailService.sendRegistrationOtp(normalizedEmail, user.name, otp);
      } catch (err: unknown) {
        if (otpRecordId) {
          await otpService.cleanupFailedDeliveryOtp(otpRecordId);
        }
        if (err instanceof AuthError) throw err;
        throw new AuthError(
          'Failed to resend verification code. Please try again.',
          502
        );
      }

      return {
        success: true,
        message: 'A fresh verification code has been sent to your email address.',
      };
    } else {
      // For password reset, reuse forgotPassword logic for generic enumeration protection
      return this.forgotPassword({ email: normalizedEmail });
    }
  },

  /**
   * Initiates forgot-password flow.
   * Returns generic message to prevent account enumeration.
   */
  async forgotPassword(
    data: ForgotPasswordInput
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const genericMessage =
      'If an account associated with this email address exists, a 6-digit password recovery code has been sent.';

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Return generic success response to prevent email enumeration
      return {
        success: true,
        message: genericMessage,
      };
    }

    let otpRecordId: string | null = null;
    try {
      const { otp, recordId } = await otpService.createAndStoreOtp({
        email: normalizedEmail,
        purpose: OtpPurpose.PASSWORD_RESET,
        userId: user.id,
      });
      otpRecordId = recordId;

      await emailService.sendPasswordResetOtp(normalizedEmail, user.name, otp);
    } catch (err: unknown) {
      if (otpRecordId) {
        await otpService.cleanupFailedDeliveryOtp(otpRecordId);
      }
      // If cooldown was hit, rethrow cooldown error so client knows to wait
      if (err instanceof AuthError && err.statusCode === 429) {
        throw err;
      }
      // Otherwise suppress provider error to maintain generic response or safe failure
      console.error('[ForgotPassword Error]', err);
    }

    return {
      success: true,
      message: genericMessage,
    };
  },

  /**
   * Resets password using OTP, updates passwordHash, and invalidates all existing sessions
   */
  async resetPassword(
    data: ResetPasswordInput
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = data.email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AuthError('Invalid or expired password reset code.', 400);
    }

    // Atomically verify OTP for PASSWORD_RESET purpose
    await otpService.verifyOtp({
      email: normalizedEmail,
      otp: data.otp,
      purpose: OtpPurpose.PASSWORD_RESET,
    });

    // Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

    // Atomically update password and increment tokenVersion (revoking all active JWT sessions)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        tokenVersion: { increment: 1 },
      },
    });

    return {
      success: true,
      message:
        'Password has been reset successfully. You can now sign in with your new password.',
    };
  },

  /**
   * Authenticates broker using mobile number or email.
   * Blocks login if email is not yet verified.
   */
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
      throw new AuthError('Invalid credentials', 401);
    }

    const passwordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordValid) {
      throw new AuthError('Invalid credentials', 401);
    }

    // Prevent unverified accounts from logging in
    if (!user.isEmailVerified) {
      throw new AuthError(
        'Your email address has not been verified. Please verify your email before signing in.',
        403,
        {
          requiresVerification: true,
          email: user.email,
        }
      );
    }

    const token = this.generateToken({
      userId: user.id,
      mobileNumber: user.mobileNumber,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      tokenVersion: user.tokenVersion,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        phone: user.mobileNumber,
        email: user.email,
        businessName: user.businessName,
        isEmailVerified: user.isEmailVerified,
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
        isEmailVerified: true,
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
      isEmailVerified: user.isEmailVerified,
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
      tokenVersion: updatedUser.tokenVersion,
    });

    return {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        mobileNumber: updatedUser.mobileNumber,
        phone: updatedUser.mobileNumber,
        email: updatedUser.email,
        businessName: updatedUser.businessName,
        isEmailVerified: updatedUser.isEmailVerified,
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

    // Identify all bill attachments for this user in paginated batches (bounded memory)
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

    // Cascade delete user and all associated companies, bills, and data in an atomic transaction
    await prisma.$transaction([
      prisma.bill.deleteMany({ where: { userId } }),
      prisma.company.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    // Clean up associated Backblaze B2 cloud objects
    let cleanup = {
      total: 0,
      deleted: [] as string[],
      failed: [] as any[],
      skipped: [] as string[],
    };
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
