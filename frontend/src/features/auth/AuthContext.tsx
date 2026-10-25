import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { authService, sessionPersistence, apiClient } from '../../services';
import {
  AuthResponse,
  ForgotPasswordData,
  GenericSuccessResponse,
  LoginCredentials,
  RegisterData,
  RegisterResponse,
  ResendOtpData,
  ResetPasswordData,
  UpdateProfileData,
  User,
  VerifyEmailData,
} from '../../types/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<RegisterResponse>;
  verifyEmail: (data: VerifyEmailData) => Promise<AuthResponse>;
  resendOtp: (data: ResendOtpData) => Promise<GenericSuccessResponse>;
  forgotPassword: (data: ForgotPasswordData) => Promise<GenericSuccessResponse>;
  resetPassword: (data: ResetPasswordData) => Promise<GenericSuccessResponse>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<User>;
  deleteAccount(password?: string): Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Instant recovery from local persistent storage so Home screen loads immediately
        const stored = await sessionPersistence.getSession();
        if (stored.token && stored.user && isMounted) {
          apiClient.setAuthToken(stored.token);
          apiClient.setCurrentUser(stored.user);
          setUser(stored.user);
          setIsLoading(false);
        }

        // 2. Validate/refresh session in background
        const verifiedUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(verifiedUser);
        }
      } catch (err) {
        console.warn('[AuthContext] Session initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      // Note: registration does not authenticate user immediately;
      // it returns requiresVerification: true and requires OTP verification
      return response;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (data: VerifyEmailData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verifyEmail(data);
      setUser(response.user);
      return response;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Verification failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendOtp = useCallback(async (data: ResendOtpData) => {
    setError(null);
    try {
      const response = await authService.resendOtp(data);
      return response;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to resend code. Please try again.';
      setError(message);
      throw err;
    }
  }, []);

  const forgotPassword = useCallback(async (data: ForgotPasswordData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.forgotPassword(data);
      return response;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to request reset code. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.resetPassword(data);
      return response;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Password reset failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.updateProfile(data);
      setUser(response.user);
      return response.user;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update profile. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async (password?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.deleteAccount(password);
      setUser(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to delete account. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        verifyEmail,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
        updateProfile,
        deleteAccount,
        clearError,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
