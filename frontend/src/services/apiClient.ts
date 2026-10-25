import { API_BASE_URL } from '@env';
import { Platform } from 'react-native';
import { User } from '../types/auth';

/**
 * Primary Backend URL loaded dynamically from .env (API_BASE_URL)
 * with automatic fallback to local emulator (10.0.2.2) and localhost USB.
 */
const configuredEnvUrl = API_BASE_URL ? API_BASE_URL.replace(/\/+$/, '') : null;
const CANDIDATE_BASE_URLS: string[] = [
  configuredEnvUrl || 'https://plausibly-groin-subfloor.ngrok-free.dev/api',
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api',
  'http://localhost:5000/api',
];
let candidateIndex = 0;
let isHostLocked = false;

let apiBaseUrl: string = CANDIDATE_BASE_URLS[0];
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
  data?: any;

  constructor(
    message: string,
    statusCode: number,
    details?: unknown,
    data?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.data = data;
  }
}

/**
 * Centralized HTTP request dispatcher with automatic Bearer token injection,
 * ngrok-skip-browser-warning header for free ngrok tunnels,
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
    'ngrok-skip-browser-warning': 'true',
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
    // If not locked and another host candidate exists
    if (!isHostLocked && candidateIndex < CANDIDATE_BASE_URLS.length - 1) {
      candidateIndex++;
      apiBaseUrl = CANDIDATE_BASE_URLS[candidateIndex];
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
          `Cannot connect to backend at ${apiClient.getBaseUrl()}. Please ensure backend is running and reachable: ${originalMessage}`,
          0
        );
      }
    } else {
      const originalMessage =
        err instanceof Error ? err.message : 'Network request failed';
      throw new ApiError(
        `Cannot connect to backend at ${apiClient.getBaseUrl()}. Please ensure backend is running and reachable: ${originalMessage}`,
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
      typeof data === 'object' ? data?.details : undefined,
      data
    );
  }

  return data as T;
}
