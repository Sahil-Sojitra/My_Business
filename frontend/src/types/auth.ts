export interface User {
  id: string;
  name: string;
  phone: string; // 10-digit mobile number (primary login identifier)
  email?: string;
  businessName?: string;
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
