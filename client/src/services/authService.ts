import { apiClient } from './api';
import type { AuthResponse, Tenant, User } from '@types/auth';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
  tenantName?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to login');
    }
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to register');
    }
    return response.data;
  },

  async getCurrentUser(): Promise<{ user: User; tenant: Tenant }> {
    const response = await apiClient.get<AuthResponse>('/auth/me');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to fetch session');
    }
    return { user: response.data.user, tenant: response.data.tenant };
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to refresh session');
    }
    return response.data;
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.patch<{ user: User }>('/auth/profile', userData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to update profile');
    }
    return response.data.user;
  },

  logout(): void {
    void apiClient.post('/auth/logout');
  },
};
