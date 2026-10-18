import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@my_business:auth_token',
  CURRENT_USER: '@my_business:current_user',
  SESSION_TIMESTAMP: '@my_business:session_timestamp',
};

export interface StoredSession {
  token: string | null;
  user: User | null;
  loginTimestamp: number | null;
}

/**
 * Service providing asynchronous persistent storage for user session and authentication credentials.
 * Ensures the broker remains logged in across app restarts throughout their workday (4-8+ hours or 7 days).
 */
export const sessionPersistence = {
  /**
   * Persists authentication credentials and user profile to disk.
   */
  async saveSession(token: string, user: User): Promise<void> {
    try {
      const now = Date.now();
      await AsyncStorage.setMany({
        [STORAGE_KEYS.AUTH_TOKEN]: token,
        [STORAGE_KEYS.CURRENT_USER]: JSON.stringify(user),
        [STORAGE_KEYS.SESSION_TIMESTAMP]: now.toString(),
      });
    } catch (e) {
      console.warn('[SessionPersistence] Failed to save session:', e);
    }
  },

  /**
   * Retrieves stored session from disk.
   */
  async getSession(): Promise<StoredSession> {
    try {
      const records = await AsyncStorage.getMany([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.CURRENT_USER,
        STORAGE_KEYS.SESSION_TIMESTAMP,
      ]);

      const token = records[STORAGE_KEYS.AUTH_TOKEN] || null;
      const userJson = records[STORAGE_KEYS.CURRENT_USER];
      const timestampStr = records[STORAGE_KEYS.SESSION_TIMESTAMP];

      let user: User | null = null;
      if (userJson) {
        try {
          user = JSON.parse(userJson);
        } catch {
          user = null;
        }
      }

      const loginTimestamp = timestampStr ? parseInt(timestampStr, 10) : null;

      return { token, user, loginTimestamp };
    } catch (e) {
      console.warn('[SessionPersistence] Failed to read session:', e);
      return { token: null, user: null, loginTimestamp: null };
    }
  },

  /**
   * Updates only the cached user profile while preserving existing token and timestamp.
   */
  async updateUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (e) {
      console.warn('[SessionPersistence] Failed to update user profile in storage:', e);
    }
  },

  /**
   * Clears persisted credentials upon explicit user logout or account deletion.
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeMany([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.CURRENT_USER,
        STORAGE_KEYS.SESSION_TIMESTAMP,
      ]);
    } catch (e) {
      console.warn('[SessionPersistence] Failed to clear session:', e);
    }
  },
};
