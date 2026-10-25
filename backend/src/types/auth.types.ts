export interface AuthUser {
  id: string;
  name: string;
  mobileNumber: string;
  phone?: string;
  email?: string | null;
  businessName?: string | null;
  isEmailVerified?: boolean;
}

export interface UserResponse {
  id: string;
  name: string;
  mobileNumber: string;
  phone?: string;
  email?: string | null;
  businessName?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export const OtpPurpose = {
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];

export interface EmailOtp {
  id: string;
  userId: string | null;
  email: string;
  otpHash: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  attempts: number;
  resendAvailableAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
