import { apiClient } from './api';
import type { ApiResponse } from './api';
import type { AuthResponse, Tenant, User } from '@types/auth';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

const ensureAuthResponse = (response: ApiResponse<AuthResponse>) => {
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Authentication request failed');
  }
  return response.data;
};

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    if (response.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    }
  },

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    const data = ensureAuthResponse(response);
    this.setSession(data);
    return data;
  },

  async register(payload: Record<string, unknown>): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    const data = ensureAuthResponse(response);
    this.setSession(data);
    return data;
  },

  async getCurrentUser(): Promise<{ user: User; tenant: Tenant }> {
    const response = await apiClient.get<AuthResponse>('/auth/me');
    const data = ensureAuthResponse(response);
    return { user: data.user, tenant: data.tenant };
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    const data = ensureAuthResponse(response);
    this.setSession(data);
    return data;
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.patch<{ user: User }>('/auth/profile', userData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to update profile');
    }
    return response.data.user;
  },

  async updateTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
    const response = await apiClient.patch<{ tenant: Tenant }>('/auth/tenant', tenantData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to update tenant');
    }
    return response.data.tenant;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      this.clearSession();
    }
  },
};
