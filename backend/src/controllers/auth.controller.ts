import { Request, Response } from 'express';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  deleteAccountSchema,
} from '../schemas/auth.schema.js';
import { authService, AuthError } from '../services/auth.service.js';

/**
 * POST /api/auth/register
 * Registers a new broker with their 10-digit mobile number and password.
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
        error: err.statusCode === 409 ? 'Conflict' : 'Bad Request',
        message: err.message,
        statusCode: err.statusCode,
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
 * POST /api/auth/login
 * Authenticates broker using their 10-digit mobile number and password.
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
        error: err.statusCode === 401 ? 'Unauthorized' : 'Bad Request',
        message: err.message,
        statusCode: err.statusCode,
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
        error: err.statusCode === 409 ? 'Conflict' : 'Bad Request',
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
