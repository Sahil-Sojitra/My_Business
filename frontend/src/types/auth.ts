export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  businessName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
