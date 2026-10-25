export interface User {
  id: string;
  name: string;
  phone: string; // 10-digit mobile number (primary login identifier)
  email?: string;
  businessName?: string;
  isEmailVerified?: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  phone: string; // 10-digit mobile number
  password: string;
}

export interface RegisterData {
  name: string;
  phone: string; // 10-digit mobile number
  email: string; // Required broker email
  password: string;
  businessName?: string;
}

export interface RegisterResponse {
  message: string;
  requiresVerification: boolean;
  email: string;
  user: User;
}

export interface VerifyEmailData {
  email: string;
  otp: string;
}

export interface ResendOtpData {
  email: string;
  purpose?: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface GenericSuccessResponse {
  success: boolean;
  message: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  email?: string;
  businessName?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
