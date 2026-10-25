import { randomInt, createHmac, timingSafeEqual } from 'crypto';
import prisma from '../lib/prisma.js';
import { OtpPurpose, type EmailOtp } from '../types/auth.types.js';
import { AuthError } from '../utils/errors.js';

const OTP_SECRET =
  process.env.JWT_SECRET ||
  'my_business_otp_salt_secret_2026_change_in_production';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure 6-digit numeric OTP string
 */
export const generateSecureNumericOtp = (): string => {
  return randomInt(100000, 1000000).toString();
};

/**
 * Compute HMAC-SHA256 hash of an OTP code with application secret.
 * This prevents rainbow table attacks on the 6-digit OTP search space.
 */
export const hashOtp = (otp: string, email: string): string => {
  return createHmac('sha256', OTP_SECRET)
    .update(`${email.trim().toLowerCase()}:${otp}`)
    .digest('hex');
};

/**
 * Timing-safe string comparison to prevent timing side-channel attacks
 */
export const timingSafeCompare = (a: string, b: string): boolean => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

export const otpService = {
  /**
   * Generates and stores a new OTP for the given email and purpose.
   * Enforces 60-second cooldown and invalidates previous active OTPs.
   */
  async createAndStoreOtp({
    email,
    purpose,
    userId,
  }: {
    email: string;
    purpose: OtpPurpose;
    userId?: string;
  }): Promise<{ otp: string; recordId: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    // Check resend cooldown on the most recent unconsumed OTP
    const existingActiveOtp = await prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingActiveOtp && existingActiveOtp.resendAvailableAt > now) {
      const remainingSeconds = Math.ceil(
        (existingActiveOtp.resendAvailableAt.getTime() - now.getTime()) / 1000
      );
      throw new AuthError(
        `Please wait ${remainingSeconds} second(s) before requesting another code.`,
        429
      );
    }

    // Invalidate all previously issued unconsumed OTPs for this email & purpose
    await prisma.emailOtp.updateMany({
      where: {
        email: normalizedEmail,
        purpose,
        consumedAt: null,
      },
      data: {
        consumedAt: now,
      },
    });

    // Generate fresh cryptographically secure 6-digit OTP
    const plainOtp = generateSecureNumericOtp();
    const otpHash = hashOtp(plainOtp, normalizedEmail);

    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);
    const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS);

    const record = await prisma.emailOtp.create({
      data: {
        userId: userId || null,
        email: normalizedEmail,
        otpHash,
        purpose,
        expiresAt,
        resendAvailableAt,
        attempts: 0,
      },
    });

    return {
      otp: plainOtp,
      recordId: record.id,
    };
  },

  /**
   * Delete or invalidate an OTP record if email delivery failed.
   * Prevents leaving an active OTP that the user never received.
   */
  async cleanupFailedDeliveryOtp(recordId: string): Promise<void> {
    try {
      await prisma.emailOtp.delete({
        where: { id: recordId },
      });
    } catch {
      // Ignored if already cleaned up
    }
  },

  /**
   * Atomically verifies the submitted OTP against the active unconsumed record.
   * Enforces 5-minute expiry, max 5 failed attempts, and single-use consumption.
   */
  async verifyOtp({
    email,
    otp,
    purpose,
  }: {
    email: string;
    otp: string;
    purpose: OtpPurpose;
  }): Promise<{ valid: boolean; userId: string | null }> {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();
    const now = new Date();

    const activeOtp = await prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeOtp) {
      throw new AuthError('Invalid or expired verification code.', 400);
    }

    // Expiry check
    if (activeOtp.expiresAt < now) {
      // Invalidate expired OTP
      await prisma.emailOtp.update({
        where: { id: activeOtp.id },
        data: { consumedAt: now },
      });
      throw new AuthError(
        'Verification code has expired. Please request a new one.',
        400
      );
    }

    // Attempt limit check
    if (activeOtp.attempts >= MAX_OTP_ATTEMPTS) {
      // Invalidate locked OTP
      await prisma.emailOtp.update({
        where: { id: activeOtp.id },
        data: { consumedAt: now },
      });
      throw new AuthError(
        'Too many failed attempts. This code has been invalidated. Please request a new one.',
        400
      );
    }

    // Constant-time hash verification
    const expectedHash = hashOtp(trimmedOtp, normalizedEmail);
    const matches = timingSafeCompare(activeOtp.otpHash, expectedHash);

    if (!matches) {
      const updatedAttempts = activeOtp.attempts + 1;
      const isLocked = updatedAttempts >= MAX_OTP_ATTEMPTS;

      await prisma.emailOtp.update({
        where: { id: activeOtp.id },
        data: {
          attempts: updatedAttempts,
          consumedAt: isLocked ? now : null,
        },
      });

      if (isLocked) {
        throw new AuthError(
          'Too many incorrect attempts. This code has been invalidated. Please request a new one.',
          400
        );
      }

      const remainingAttempts = MAX_OTP_ATTEMPTS - updatedAttempts;
      throw new AuthError(
        `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
        400
      );
    }

    // Atomic conditional consumption to prevent concurrent replay
    const consumptionResult = await prisma.emailOtp.updateMany({
      where: {
        id: activeOtp.id,
        consumedAt: null,
      },
      data: {
        consumedAt: now,
      },
    });

    if (consumptionResult.count === 0) {
      throw new AuthError(
        'Verification code has already been consumed. Please request a new one.',
        400
      );
    }

    return {
      valid: true,
      userId: activeOtp.userId,
    };
  },
};
