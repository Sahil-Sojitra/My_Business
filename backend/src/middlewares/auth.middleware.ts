import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser } from '../types/auth.types.js';

interface JwtPayload {
  userId: string;
  mobileNumber: string;
  name: string;
  email?: string | null;
  businessName?: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'my_business_super_secret_jwt_key_2026_change_in_production';

/**
 * Middleware to authenticate requests via Bearer JWT token.
 * Populates req.user with the verified broker's identity.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
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

    req.user = {
      id: decoded.userId,
      mobileNumber: decoded.mobileNumber,
      phone: decoded.mobileNumber, // Alias for frontend compatibility
      name: decoded.name,
      email: decoded.email,
      businessName: decoded.businessName,
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
