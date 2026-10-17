export interface AuthUser {
  id: string;
  name: string;
  mobileNumber: string;
  phone?: string;
  email?: string | null;
  businessName?: string | null;
}

export interface UserResponse {
  id: string;
  name: string;
  mobileNumber: string;
  phone?: string;
  email?: string | null;
  businessName?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}
