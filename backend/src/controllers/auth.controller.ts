import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { normalizeMobileNumber, isValidMobileNumber } from '../utils/phone.js';

const JWT_SECRET = process.env.JWT_SECRET || 'my_business_super_secret_jwt_key_2026_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validation schema for registration
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  mobileNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().trim().email('Invalid email address format').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().trim().optional(),
}).refine(data => Boolean(data.mobileNumber || data.phone), {
  message: 'Mobile number is required for registration',
  path: ['mobileNumber'],
});

// Validation schema for login
const loginSchema = z.object({
  mobileNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(data => Boolean(data.mobileNumber || data.phone || data.email), {
  message: 'Mobile number is required for sign in',
  path: ['mobileNumber'],
});

/**
 * POST /api/auth/register
 * Registers a new broker with their mobile number and password.
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

    const { name, password, email, businessName } = parseResult.data;
    const rawMobile = parseResult.data.mobileNumber || parseResult.data.phone || '';
    const normalizedMobile = normalizeMobileNumber(rawMobile);

    if (!isValidMobileNumber(normalizedMobile)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Please provide a valid 10-digit mobile number',
        statusCode: 400,
      });
    }

    // Check if mobile number is already registered
    const existingUser = await prisma.user.findUnique({
      where: { mobileNumber: normalizedMobile },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this mobile number already exists. Please sign in.',
        statusCode: 409,
      });
    }

    // Hash the password with 10 bcrypt salt rounds
    const passwordHash = await bcrypt.hash(password, 10);

    // Create broker in the database
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        mobileNumber: normalizedMobile,
        email: email ? email.trim().toLowerCase() : null,
        passwordHash,
        businessName: businessName?.trim() || 'My Business',
      },
    });

    // Generate authenticated JWT session token
    const token = jwt.sign(
      {
        userId: user.id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        phone: user.mobileNumber, // Provided for frontend backward compatibility
        email: user.email,
        businessName: user.businessName,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    });
  } catch (err) {
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
 * Authenticates broker using their mobile number and password.
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

    const { password } = parseResult.data;
    const rawIdentifier =
      parseResult.data.mobileNumber ||
      parseResult.data.phone ||
      parseResult.data.email ||
      '';

    let user = null;

    // Check if the identifier is a mobile number or email
    const normalizedMobile = normalizeMobileNumber(rawIdentifier);
    if (isValidMobileNumber(normalizedMobile)) {
      user = await prisma.user.findUnique({
        where: { mobileNumber: normalizedMobile },
      });
    } else if (rawIdentifier.includes('@')) {
      // Allow fallback login by email if broker used email
      user = await prisma.user.findFirst({
        where: { email: rawIdentifier.trim().toLowerCase() },
      });
    }

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid mobile number or password.',
        statusCode: 401,
      });
    }

    // Verify password against stored bcrypt hash
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid mobile number or password.',
        statusCode: 401,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    return res.status(200).json({
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
    });
  } catch (err) {
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

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found.',
        statusCode: 404,
      });
    }

    return res.status(200).json({
      id: user.id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      phone: user.mobileNumber,
      email: user.email,
      businessName: user.businessName,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[GetMe Error]', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user profile.',
      statusCode: 500,
    });
  }
};
