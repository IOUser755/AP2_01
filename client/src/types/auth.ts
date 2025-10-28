export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'DEVELOPER' | 'VIEWER';

export interface User {
  _id: string;
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
  isVerified: boolean;
  isActive: boolean;
  twoFactorEnabled: boolean;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscriptionLimits {
  agents: number;
  transactions: number;
  storage: number;
}

export interface TenantSubscription {
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID';
  billingCycle: 'MONTHLY' | 'YEARLY';
  features: string[];
  limits: TenantSubscriptionLimits;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  language: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface Tenant {
  _id: string;
  id?: string;
  name: string;
  domain: string;
  subdomain: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  subscription: TenantSubscription;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  tenantName: string;
  agreeToTerms: boolean;
  subscriptionPlan?: string;
}
