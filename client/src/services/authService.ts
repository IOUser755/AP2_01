import { apiClient } from './api';
import type { ApiResponse } from './api';
import type { RegisterData, Tenant, User } from '@types/auth';

export interface AuthResponse {
  user: User;
  tenant: Tenant;
  token: string;
  refreshToken: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'ap2_user';
  private readonly TENANT_KEY = 'ap2_tenant';

  private setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private setStoredUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private setStoredTenant(tenant: Tenant): void {
    localStorage.setItem(this.TENANT_KEY, JSON.stringify(tenant));
  }

  private parseResponse<T>(response: ApiResponse<T>, fallback: string): T {
    if (!response.success) {
      throw new Error(response.message || fallback);
    }

    return response.data;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getStoredUser(): User | null {
    const cached = localStorage.getItem(this.USER_KEY);
    return cached ? (JSON.parse(cached) as User) : null;
  }

  getStoredTenant(): Tenant | null {
    const cached = localStorage.getItem(this.TENANT_KEY);
    return cached ? (JSON.parse(cached) as Tenant) : null;
  }

  setSession(authData: AuthResponse): void {
    this.setTokens(authData.token, authData.refreshToken);
    this.setStoredUser(authData.user);
    this.setStoredTenant(authData.tenant);
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TENANT_KEY);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });

    const payload = this.parseResponse(response, 'Unable to complete login request.');
    this.setSession(payload);
    return payload;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    const payload = this.parseResponse(response, 'Unable to create your account.');
    this.setSession(payload);
    return payload;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      this.clearSession();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('Session expired. Please login again.');
    }

    const response = await apiClient.post<AuthResponse>(
      '/auth/refresh',
      { refreshToken },
      { skipAuthRefresh: true }
    );

    const payload = this.parseResponse(response, 'Unable to refresh authentication session.');
    this.setSession(payload);
    return payload;
  }

  async getCurrentUser(): Promise<{ user: User; tenant: Tenant }> {
    const response = await apiClient.get<AuthResponse>('/auth/me');
    const payload = this.parseResponse(response, 'Unable to load session information.');
    this.setStoredUser(payload.user);
    this.setStoredTenant(payload.tenant);
    return { user: payload.user, tenant: payload.tenant };
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>('/auth/profile', userData);
    const updatedUser = this.parseResponse(response, 'Unable to update your profile.');
    this.setStoredUser(updatedUser);
    return updatedUser;
  }

  async updateTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
    const response = await apiClient.patch<Tenant>('/auth/tenant', tenantData);
    const updatedTenant = this.parseResponse(response, 'Unable to update tenant settings.');
    this.setStoredTenant(updatedTenant);
    return updatedTenant;
  }

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  }

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  }

  async resendEmailVerification(): Promise<void> {
    await apiClient.post('/auth/resend-verification');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };
      if (!payload.exp) return false;
      return Date.now() < payload.exp * 1000;
    } catch (error) {
      return false;
    }
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };
      if (!payload.exp) return true;
      return Date.now() >= payload.exp * 1000;
    } catch (error) {
      return true;
    }
  }
}

export const authService = new AuthService();

export type { RegisterData, Tenant, User } from '@types/auth';
