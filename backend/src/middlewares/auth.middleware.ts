import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { AuthUser } from '../types/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JwtPayload {
  userId: string;
  mobileNumber: string;
  name: string;
  email?: string | null;
  businessName?: string | null;
  tokenVersion?: number;
}

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'my_business_super_secret_jwt_key_2026_change_in_production';

/**
 * Middleware to authenticate requests via Bearer JWT token.
 * Populates req.user with the verified broker's identity and checks session version.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token required. Please sign in to continue.',
      statusCode: 401,
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Check user existence, session version, and email verification status
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        tokenVersion: true,
        isEmailVerified: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User account not found.',
        statusCode: 401,
      });
    }

    // Revoke old tokens if password was reset
    if (
      decoded.tokenVersion !== undefined &&
      dbUser.tokenVersion !== decoded.tokenVersion
    ) {
      return res.status(401).json({
        error: 'Unauthorized',
        message:
          'Session has been invalidated due to a security update. Please sign in again.',
        statusCode: 401,
      });
    }

    // Block unverified accounts from protected resources
    if (!dbUser.isEmailVerified) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Please verify your email address before accessing this resource.',
        requiresVerification: true,
        statusCode: 403,
      });
    }

    req.user = {
      id: decoded.userId,
      mobileNumber: decoded.mobileNumber,
      phone: decoded.mobileNumber,
      name: decoded.name,
      email: decoded.email,
      businessName: decoded.businessName,
      isEmailVerified: dbUser.isEmailVerified,
    };

    return next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session has expired. Please sign in again.',
        statusCode: 401,
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token.',
      statusCode: 401,
    });
  }
};
