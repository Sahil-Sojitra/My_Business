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
  password: string;
  email?: string;
  businessName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
