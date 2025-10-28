export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  DEVELOPER: 'DEVELOPER',
  VIEWER: 'VIEWER',
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'FREE',
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  PAST_DUE: 'PAST_DUE',
  TRIAL: 'TRIAL',
} as const;

export const AGENT_TYPES = {
  SHOPPING: 'SHOPPING',
  INVESTMENT: 'INVESTMENT',
  BILL_PAY: 'BILL_PAY',
  PROCUREMENT: 'PROCUREMENT',
  CUSTOM: 'CUSTOM',
} as const;

export const AGENT_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const TRANSACTION_TYPES = {
  PAYMENT: 'PAYMENT',
  REFUND: 'REFUND',
  TRANSFER: 'TRANSFER',
  SETTLEMENT: 'SETTLEMENT',
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export const MANDATE_TYPES = {
  INTENT: 'INTENT',
  CART: 'CART',
  PAYMENT: 'PAYMENT',
  VERIFICATION: 'VERIFICATION',
} as const;

export const PAYMENT_PROVIDERS = {
  STRIPE: 'STRIPE',
  COINBASE: 'COINBASE',
  CRYPTO: 'CRYPTO',
  BANK: 'BANK',
} as const;

export const PLAN_LIMITS = {
  FREE: {
    maxAgents: 3,
    maxTransactionsPerMonth: 1000,
    maxUsers: 5,
    maxTemplates: 0,
  },
  STARTER: {
    maxAgents: 10,
    maxTransactionsPerMonth: 10000,
    maxUsers: 10,
    maxTemplates: 5,
  },
  PROFESSIONAL: {
    maxAgents: 50,
    maxTransactionsPerMonth: 100000,
    maxUsers: 50,
    maxTemplates: 20,
  },
  ENTERPRISE: {
    maxAgents: -1, // unlimited
    maxTransactionsPerMonth: -1, // unlimited
    maxUsers: -1, // unlimited
    maxTemplates: -1, // unlimited
  },
} as const;
