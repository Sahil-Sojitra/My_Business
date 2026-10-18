import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  User,
} from '../types/auth';
import { apiClient, request } from './apiClient';

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(data: RegisterData): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  updateProfile(data: UpdateProfileData): Promise<AuthResponse>;
  deleteAccount(
    password?: string
  ): Promise<{ success: boolean; message: string }>;
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

  async updateProfile(data: UpdateProfileData): Promise<AuthResponse> {
    const cleanPhone = data.phone
      ? data.phone.trim().replace(/\D/g, '')
      : undefined;

    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (cleanPhone !== undefined && cleanPhone.length > 0)
      payload.mobileNumber = cleanPhone;
    if (data.email !== undefined) payload.email = data.email.trim();
    if (data.businessName !== undefined)
      payload.businessName = data.businessName.trim();
    if (data.currentPassword) payload.currentPassword = data.currentPassword;
    if (data.newPassword) payload.newPassword = data.newPassword;

    const response = await request<AuthResponse>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (response.token) {
      apiClient.setAuthToken(response.token);
    }
    apiClient.setCurrentUser(response.user);
    return response;
  }

  async deleteAccount(
    password?: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await request<{ success: boolean; message: string }>(
      '/auth/account',
      {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      }
    );

    await this.logout();
    return response;
  }
}

export const authService: IAuthService = new RealAuthService();
