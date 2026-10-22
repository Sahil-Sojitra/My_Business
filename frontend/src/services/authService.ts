import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  User,
} from '../types/auth';
import { ApiError, apiClient, request } from './apiClient';
import { sessionPersistence } from './storage';

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
 * Integrates with persistent storage so user remains logged in across app restarts.
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
    await sessionPersistence.saveSession(response.token, response.user);
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
    await sessionPersistence.saveSession(response.token, response.user);
    return response;
  }

  async logout(): Promise<void> {
    apiClient.setAuthToken(null);
    apiClient.setCurrentUser(null);
    await sessionPersistence.clearSession();
  }

  async getCurrentUser(): Promise<User | null> {
    let token = apiClient.getAuthToken();
    let cachedUser = apiClient.getCurrentUser();

    // If token or cached user is not in memory (e.g. app just restarted), load from disk
    if (!token || !cachedUser) {
      const stored = await sessionPersistence.getSession();
      token = stored.token;
      cachedUser = stored.user;

      if (token) {
        apiClient.setAuthToken(token);
      }
      if (cachedUser) {
        apiClient.setCurrentUser(cachedUser);
      }
    }

    // If no stored credentials exist, user is unauthenticated
    if (!token) {
      return null;
    }

    try {
      const freshUser = await request<User>('/auth/me');
      apiClient.setCurrentUser(freshUser);
      await sessionPersistence.updateUser(freshUser);
      return freshUser;
    } catch (err: unknown) {
      // If server returned 401 Unauthorized or 404 Not Found (user deleted/reset on backend), clear session
      if (err instanceof ApiError && (err.statusCode === 401 || err.statusCode === 404)) {
        console.log(`[Auth] Session invalid (${err.statusCode}), clearing stale token and logging out.`);
        await this.logout();
        return null;
      }

      // If network error (offline, slow connection, backend restart), keep cached user!
      // This prevents unnecessary logouts when user opens app in poor reception
      if (cachedUser) {
        return cachedUser;
      }

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
      await sessionPersistence.saveSession(response.token, response.user);
    } else {
      await sessionPersistence.updateUser(response.user);
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
