import { Router } from 'express';
import {
  register,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
  login,
  getMe,
  updateProfile,
  deleteAccount,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: Router = Router();

// Public auth endpoints
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/login', login);

// Protected auth endpoints
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.delete('/account', authenticate, deleteAccount);

export default router;
