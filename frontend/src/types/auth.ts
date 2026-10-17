export interface User {
  id: string;
  name: string;
  phone: string;
  mobileNumber?: string;
  email?: string;
  businessName?: string;
  createdAt: string;
}

export interface LoginCredentials {
  phone: string; // 10-digit phone / mobile number for login
  password: string;
  mobileNumber?: string;
  email?: string;
}

export interface RegisterData {
  name: string;
  phone: string; // 10-digit phone / mobile number
  mobileNumber?: string;
  password: string;
  email?: string;
  businessName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
