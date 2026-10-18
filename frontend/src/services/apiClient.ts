import { Platform } from 'react-native';
import { User } from '../types/auth';

/**
 * Android emulator routes host machine loopback to 10.0.2.2.
 * iOS Simulator, macOS, and Web route to localhost directly.
 */
const CANDIDATE_HOSTS =
  Platform.OS === 'android' ? ['localhost', '10.0.2.2'] : ['localhost'];
let candidateIndex = 0;
let isHostLocked = false;

let apiBaseUrl: string = `http://${CANDIDATE_HOSTS[0]}:5000/api`;
let activeAuthToken: string | null = null;
let activeUser: User | null = null;

export const apiClient = {
  getBaseUrl(): string {
    return apiBaseUrl;
  },

  setBaseUrl(url: string): void {
    apiBaseUrl = url.replace(/\/+$/, '');
    isHostLocked = true;
  },

  getAuthToken(): string | null {
    return activeAuthToken;
  },

  setAuthToken(token: string | null): void {
    activeAuthToken = token;
  },

  getCurrentUser(): User | null {
    return activeUser;
  },

  setCurrentUser(user: User | null): void {
    activeUser = user;
  },
};

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Centralized HTTP request dispatcher with automatic Bearer token injection,
 * automatic physical device USB (localhost) / emulator (10.0.2.2) fallback,
 * and normalized error response handling.
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = apiClient.getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${apiClient.getBaseUrl()}${cleanEndpoint}`, {
      ...options,
      headers,
    });
    // Successful connection locks the working host
    isHostLocked = true;
  } catch (err: unknown) {
    // If not locked and another host candidate exists (e.g. switching from localhost to 10.0.2.2 for emulator)
    if (!isHostLocked && candidateIndex < CANDIDATE_HOSTS.length - 1) {
      candidateIndex++;
      apiBaseUrl = `http://${CANDIDATE_HOSTS[candidateIndex]}:5000/api`;
      try {
        response = await fetch(`${apiClient.getBaseUrl()}${cleanEndpoint}`, {
          ...options,
          headers,
        });
        isHostLocked = true;
      } catch (retryErr: unknown) {
        const originalMessage =
          retryErr instanceof Error ? retryErr.message : 'Network request failed';
        throw new ApiError(
          `Cannot connect to backend at ${apiClient.getBaseUrl()}. Please ensure the backend is running (npm run dev) and accessible: ${originalMessage}`,
          0
        );
      }
    } else {
      const originalMessage =
        err instanceof Error ? err.message : 'Network request failed';
      throw new ApiError(
        `Cannot connect to backend at ${apiClient.getBaseUrl()}. Please ensure the backend is running (npm run dev) and accessible: ${originalMessage}`,
        0
      );
    }
  }

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      (typeof data === 'object' && data !== null && (data.message || data.error)) ||
      `Request failed with HTTP status ${response.status}`;
    throw new ApiError(
      message,
      response.status,
      typeof data === 'object' ? data?.details : undefined
    );
  }

  return data as T;
}
