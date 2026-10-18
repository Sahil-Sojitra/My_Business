import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from '../types/auth';
import { apiClient, request } from './apiClient';

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(data: RegisterData): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}

/**
 * Real API client implementation of IAuthService connected to backend /api/auth endpoints.
 */
class RealAuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const cleanPhone = credentials.phone.trim().replace(/\D/g, '');

    const response = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        mobileNumber: cleanPhone,
        password: credentials.password,
      }),
    });

    apiClient.setAuthToken(response.token);
    apiClient.setCurrentUser(response.user);
    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const cleanPhone = data.phone.trim().replace(/\D/g, '');

    const response = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name.trim(),
        mobileNumber: cleanPhone,
        password: data.password,
        email: data.email?.trim() || undefined,
        businessName: data.businessName?.trim() || undefined,
      }),
    });

    apiClient.setAuthToken(response.token);
    apiClient.setCurrentUser(response.user);
    return response;
  }

  async logout(): Promise<void> {
    apiClient.setAuthToken(null);
    apiClient.setCurrentUser(null);
  }

  async getCurrentUser(): Promise<User | null> {
    const token = apiClient.getAuthToken();
    if (!token) {
      return apiClient.getCurrentUser();
    }

    try {
      const user = await request<User>('/auth/me');
      apiClient.setCurrentUser(user);
      return user;
    } catch {
      apiClient.setAuthToken(null);
      apiClient.setCurrentUser(null);
      return null;
    }
  }
}

export const authService: IAuthService = new RealAuthService();
