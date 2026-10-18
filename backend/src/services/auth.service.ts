import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { normalizeMobileNumber, isValidMobileNumber } from '../utils/phone.js';
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

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

    const existingUser = await prisma.user.findUnique({
      where: { mobileNumber: normalizedMobile },
    });

    if (existingUser) {
      throw new AuthError(
        'An account with this mobile number already exists. Please sign in.',
        409
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        mobileNumber: normalizedMobile,
        email: data.email ? data.email.trim().toLowerCase() : null,
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
};
