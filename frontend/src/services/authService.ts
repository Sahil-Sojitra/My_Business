import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from '../types/auth';

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(data: RegisterData): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}

const INITIAL_MOCK_USER: User = {
  id: 'usr_1',
  name: 'Sahil Sojitra',
  email: 'broker@mybusiness.com',
  phone: '9876543210',
  businessName: 'Sojitra Trade & Brokerage',
  createdAt: new Date().toISOString(),
};

/**
 * Isolated mock authentication service for development and testing.
 * Implements IAuthService boundary so a real API client can be swapped in seamlessly.
 */
class MockAuthService implements IAuthService {
  private currentUser: User | null = INITIAL_MOCK_USER;
  private users: Array<{ user: User; passwordHash: string }> = [
    {
      user: INITIAL_MOCK_USER,
      passwordHash: 'password123',
    },
  ];

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.delay(300);

    const emailTrimmed = credentials.email.trim().toLowerCase();
    const found = this.users.find(
      u => u.user.email.toLowerCase() === emailTrimmed
    );

    if (!found || found.passwordHash !== credentials.password) {
      throw new Error('Invalid email or password');
    }

    this.currentUser = found.user;
    return {
      user: found.user,
      token: `mock_jwt_token_${found.user.id}_${Date.now()}`,
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    await this.delay(350);

    const emailTrimmed = data.email.trim().toLowerCase();
    const existing = this.users.find(
      u => u.user.email.toLowerCase() === emailTrimmed
    );

    if (existing) {
      throw new Error('An account with this email already exists');
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: data.name.trim(),
      email: emailTrimmed,
      phone: data.phone?.trim(),
      businessName: data.businessName?.trim() || 'My Business',
      createdAt: new Date().toISOString(),
    };

    this.users.push({
      user: newUser,
      passwordHash: data.password,
    });

    this.currentUser = newUser;
    return {
      user: newUser,
      token: `mock_jwt_token_${newUser.id}_${Date.now()}`,
    };
  }

  async logout(): Promise<void> {
    await this.delay(100);
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<User | null> {
    await this.delay(50);
    return this.currentUser;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const authService: IAuthService = new MockAuthService();
