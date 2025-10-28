export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'DEVELOPER' | 'VIEWER';

export interface User {
  id: string;
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  permissions: string[];
  isVerified: boolean;
  lastLogin?: string;
}

export interface Tenant {
  id: string;
  _id?: string;
  name: string;
  domain: string;
  subdomain: string;
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
}

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  tenant: Tenant;
}
