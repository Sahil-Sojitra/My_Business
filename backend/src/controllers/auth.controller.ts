import { Request, Response } from 'express';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  deleteAccountSchema,
  verifyEmailSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema.js';
import { authService, AuthError } from '../services/auth.service.js';

const getErrorName = (statusCode: number): string => {
  switch (statusCode) {
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 429:
      return 'Too Many Requests';
    case 502:
      return 'Bad Gateway';
    case 503:
      return 'Service Unavailable';
    default:
      return 'Bad Request';
  }
};

/**
 * POST /api/auth/register
 * Registers a new broker, sets account to unverified, and sends 6-digit OTP via Brevo.
 */
export const register = async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
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

    const result = await authService.registerUser(parseResult.data);
    return res.status(201).json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({
        error: getErrorName(err.statusCode),
        message: err.message,
        statusCode: err.statusCode,
        ...(err.data || {}),
      });
    }

    console.error('[Register Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create broker account. Please try again.',
      statusCode: 500,
    });
  }
};

/**
 * POST /api/auth/verify-email
 * Verifies email using 6-digit OTP code and generates authentication token.
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const parseResult = verifyEmailSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return res.status(400).json({
        error: 'Bad Request',
        message: firstIssue.message,
        statusCode: 400,
      });
    }

    const result = await authService.verifyEmail(parseResult.data);
    return res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({
        error: getErrorName(err.statusCode),
        message: err.message,
        statusCode: err.statusCode,
        ...(err.data || {}),
      });
    }

    console.error('[VerifyEmail Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Email verification failed. Please try again.',
      statusCode: 500,
    });
  }
};

/**
 * POST /api/auth/resend-otp
 * Resends verification or reset code with 60-second cooldown enforcement.
 */
export const resendOtp = async (req: Request, res: Response) => {
  try {
    const parseResult = resendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return res.status(400).json({
        error: 'Bad Request',
        message: firstIssue.message,
        statusCode: 400,
      });
    }

    const result = await authService.resendOtp(parseResult.data);
    return res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({
        error: getErrorName(err.statusCode),
        message: err.message,
        statusCode: err.statusCode,
        ...(err.data || {}),
      });
    }

    console.error('[ResendOtp Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to resend code. Please try again later.',
      statusCode: 500,
    });
  }
};

/**
 * POST /api/auth/forgot-password
 * Initiates password reset flow and sends 6-digit OTP via Brevo.
 * Returns generic response to prevent account enumeration.
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return res.status(400).json({
        error: 'Bad Request',
        message: firstIssue.message,
        statusCode: 400,
      });
    }

    const result = await authService.forgotPassword(parseResult.data);
    return res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({
        error: getErrorName(err.statusCode),
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[ForgotPassword Error]', err);
    return res.status(200).json({
      success: true,
      message:
        'If an account associated with this email address exists, a 6-digit password recovery code has been sent.',
    });
  }
};

/**
 * POST /api/auth/reset-password
 * Verifies password reset OTP, updates password, and revokes previous sessions.
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return res.status(400).json({
        error: 'Bad Request',
        message: firstIssue.message,
        statusCode: 400,
      });
    }

    const result = await authService.resetPassword(parseResult.data);
    return res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({
        error: getErrorName(err.statusCode),
        message: err.message,
        statusCode: err.statusCode,
        ...(err.data || {}),
      });
    }

    console.error('[ResetPassword Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset password. Please try again.',
      statusCode: 500,
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticates broker using mobile number or email and password.
 */
export const login = async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return res.status(400).json({
        error: 'Bad Request',
        message: firstIssue.message,
        statusCode: 400,
      });
    }

    const result = await authService.loginUser(parseResult.data);
    return res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({
        error: getErrorName(err.statusCode),
        message: err.message,
        statusCode: err.statusCode,
        ...(err.data || {}),
      });
    }

    console.error('[Login Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed. Please try again later.',
      statusCode: 500,
    });
  }
};

/**
 * GET /api/auth/me
 * Retrieves current authenticated broker's profile.
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated.',
        statusCode: 401,
      });
    }

    const profile = await authService.getUserProfile(req.user.id);
    return res.status(200).json(profile);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({
        error: 'Not Found',
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[GetMe Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve profile.',
      statusCode: 500,
    });
  }
};

/**
 * PUT /api/auth/profile
 * Updates current authenticated broker's account details.
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated.',
        statusCode: 401,
      });
    }

    const parseResult = updateProfileSchema.safeParse(req.body);
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

    const result = await authService.updateProfile(req.user.id, parseResult.data);
    return res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({
        error: getErrorName(err.statusCode),
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[UpdateProfile Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile. Please try again.',
      statusCode: 500,
    });
  }
};

/**
 * DELETE /api/auth/account
 * Permanently deletes the current authenticated broker's account and all data.
 */
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated.',
        statusCode: 401,
      });
    }

    const parseResult = deleteAccountSchema.safeParse(req.body);
    const password = parseResult.success ? parseResult.data.password : undefined;

    const result = await authService.deleteAccount(req.user.id, password);
    return res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({
        error: 'Bad Request',
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[DeleteAccount Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete account. Please try again later.',
      statusCode: 500,
    });
  }
};
