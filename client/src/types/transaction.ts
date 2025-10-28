export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'DISPUTED';

export type TransactionType =
  | 'PAYMENT'
  | 'REFUND'
  | 'TRANSFER'
  | 'SETTLEMENT'
  | 'AUTHORIZATION'
  | 'CAPTURE';

export interface TransactionAmount {
  value: number;
  currency: string;
  precision: number;
}

export interface TransactionFees {
  platform: number;
  payment: number;
  total: number;
  currency: string;
}

export type PaymentMethodType = 'CARD' | 'BANK_TRANSFER' | 'CRYPTO' | 'DIGITAL_WALLET' | 'CASH';
export type PaymentProvider = 'STRIPE' | 'COINBASE' | 'PLAID' | 'BANK_API' | 'CUSTOM';

export interface PaymentMethodDetails {
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountLast4?: string;
  routingNumber?: string;
  cryptoCurrency?: string;
  walletAddress?: string;
  walletProvider?: string;
  walletId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentMethodInfo {
  type: PaymentMethodType;
  provider: PaymentProvider;
  methodId: string;
  details: PaymentMethodDetails;
}

export interface TransactionParty {
  type: 'USER' | 'AGENT' | 'EXTERNAL' | 'MERCHANT' | 'PLATFORM';
  id?: string;
  name: string;
  email?: string;
  merchantId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface TransactionParties {
  payer: TransactionParty;
  payee: TransactionParty;
}

export interface TransactionTimelineEvent {
  status: string;
  timestamp: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionRiskAssessment {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
  reasons: string[];
  reviewRequired: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface TransactionErrorDetails {
  code: string;
  message: string;
  providerCode?: string;
  providerMessage?: string;
  retryable: boolean;
  retryCount: number;
  lastRetryAt?: string;
}

export interface TransactionSettlement {
  status: 'PENDING' | 'PROCESSING' | 'SETTLED' | 'FAILED';
  scheduledAt?: string;
  settledAt?: string;
  settlementId?: string;
  bankFees?: number;
}

export interface ExternalProviderDetails {
  provider: string;
  providerId: string;
  providerStatus: string;
  providerResponse?: Record<string, unknown>;
  webhookData?: Record<string, unknown>[];
}

export interface TransactionMetadata {
  description: string;
  reference?: string;
  invoiceId?: string;
  orderId?: string;
  tags: string[];
  agentExecutionId?: string;
  userAgent?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
}

export interface TransactionExportResponse {
  url: string;
  expiresAt: string;
}

export interface TransactionAnalytics {
  totals: {
    volume: number;
    count: number;
    currency: string;
  };
  byStatus: Record<TransactionStatus, number>;
  trends: Array<{
    period: string;
    volume: number;
    count: number;
    currency: string;
  }>;
}

export interface Transaction {
  _id: string;
  tenantId: string;
  agentId?: string;
  initiatedBy: string;
  transactionId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: TransactionAmount;
  fees: TransactionFees;
  netAmount: number;
  paymentMethod: PaymentMethodInfo;
  mandateChain: string[];
  parties: TransactionParties;
  externalProvider: ExternalProviderDetails;
  metadata: TransactionMetadata;
  riskAssessment: TransactionRiskAssessment;
  timeline: TransactionTimelineEvent[];
  errorDetails?: TransactionErrorDetails;
  settlement: TransactionSettlement;
  parentTransactionId?: string;
  childTransactions: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Mandate {
  _id: string;
  mandateId: string;
  transactionId?: string;
  tenantId: string;
  agentId?: string;
  type: 'INTENT' | 'CART' | 'PAYMENT' | 'APPROVAL' | 'CANCELLATION';
  version: string;
  status: 'PENDING' | 'APPROVED' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  content: {
    intent: {
      action: string;
      description: string;
      context: Record<string, unknown>;
    };
    authorization: {
      maxAmount?: TransactionAmount;
      validUntil?: string;
      validFrom?: string;
      geoRestrictions?: string[];
      requiresApproval: boolean;
    };
  };
  cryptography: {
    hash: string;
    hashAlgorithm: string;
    signatures: Array<{
      algorithm: 'ECDSA' | 'RSA' | 'ED25519';
      publicKey: string;
      signature: string;
      timestamp: string;
      keyId: string;
    }>;
  };
  chain: {
    chainId: string;
    previous?: string;
    next?: string;
    sequenceNumber: number;
  };
  approvals: Array<{
    userId: string;
    role: string;
    approvedAt: string;
    notes?: string;
  }>;
  execution: {
    executedAt?: string;
    executedBy?: string;
    executionResult?: {
      success: boolean;
      transactionId?: string;
      errorCode?: string;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
    };
  };
  metadata: {
    source: 'USER' | 'AGENT' | 'SYSTEM' | 'API';
    userAgent?: string;
    ipAddress?: string;
    tags: string[];
  };
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
