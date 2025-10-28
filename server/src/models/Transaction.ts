import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransactionTimeline {
  status: string;
  timestamp: Date;
  message?: string;
  metadata?: Record<string, any>;
}

export interface IPaymentMethod {
  type: 'CARD' | 'BANK_TRANSFER' | 'CRYPTO' | 'DIGITAL_WALLET' | 'CASH';
  provider: 'STRIPE' | 'COINBASE' | 'PLAID' | 'BANK_API' | 'CUSTOM';
  methodId: string; // External payment method ID
  details: {
    // Card details (masked)
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    
    // Bank details (masked)
    bankName?: string;
    accountLast4?: string;
    routingNumber?: string;
    
    // Crypto details
    cryptoCurrency?: string;
    walletAddress?: string;
    
    // Digital wallet
    walletProvider?: string;
    walletId?: string;
    
    // Additional metadata
    metadata?: Record<string, any>;
  };
}

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  agentId?: Types.ObjectId; // Optional - can be manual transactions
  initiatedBy: Types.ObjectId; // User who initiated
  transactionId: string; // Unique identifier (auto-generated)
  type: 'PAYMENT' | 'REFUND' | 'TRANSFER' | 'SETTLEMENT' | 'AUTHORIZATION' | 'CAPTURE';
  status: 'PENDING' | 'PROCESSING' | 'AUTHORIZED' | 'CAPTURED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'DISPUTED';
  amount: {
    value: number;
    currency: string;
    precision: number; // Decimal places
  };
  fees: {
    platform: number;
    payment: number;
    total: number;
    currency: string;
  };
  netAmount: number; // Amount after fees
  paymentMethod: IPaymentMethod;
  mandateChain: Types.ObjectId[]; // References to Mandate documents
  
  // Transaction parties
  parties: {
    payer: {
      type: 'USER' | 'AGENT' | 'EXTERNAL';
      id?: Types.ObjectId; // User ID if type is USER
      name: string;
      email?: string;
      address?: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
      };
    };
    payee: {
      type: 'MERCHANT' | 'USER' | 'PLATFORM' | 'EXTERNAL';
      id?: Types.ObjectId;
      name: string;
      email?: string;
      merchantId?: string;
      address?: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
      };
    };
  };
  
  // External provider details
  externalProvider: {
    provider: string; // 'stripe', 'coinbase', etc.
    providerId: string; // External transaction ID
    providerStatus: string; // Provider's status
    providerResponse?: Record<string, any>; // Raw provider response
    webhookData?: Record<string, any>[]; // Webhook events received
  };
  
  // Metadata and context
  metadata: {
    description: string;
    reference?: string; // Customer reference
    invoiceId?: string;
    orderId?: string;
    tags: string[];
    agentExecutionId?: Types.ObjectId; // Link to agent execution
    userAgent?: string;
    ipAddress?: string;
    deviceFingerprint?: string;
  };
  
  // Risk and compliance
  riskAssessment: {
    score: number; // 0-100, higher is riskier
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
    reasons: string[];
    reviewRequired: boolean;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    reviewNotes?: string;
  };
  
  // Timeline and audit
  timeline: ITransactionTimeline[];
  errorDetails?: {
    code: string;
    message: string;
    providerCode?: string;
    providerMessage?: string;
    retryable: boolean;
    retryCount: number;
    lastRetryAt?: Date;
  };
  
  // Settlement
  settlement: {
    status: 'PENDING' | 'PROCESSING' | 'SETTLED' | 'FAILED';
    scheduledAt?: Date;
    settledAt?: Date;
    settlementId?: string;
    bankFees?: number;
  };
  
  // Parent/child relationships
  parentTransactionId?: Types.ObjectId; // For refunds, captures, etc.
  childTransactions: Types.ObjectId[]; // Refunds, partial captures
  
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // For authorizations
  
  // Methods
  addTimelineEvent(status: string, message?: string, metadata?: Record<string, any>): Promise<void>;
  updateStatus(newStatus: string, message?: string): Promise<void>;
  canRefund(): boolean;
  canCapture(): boolean;
  canCancel(): boolean;
  calculateNetAmount(): number;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>({
  type: {
    type: String,
    enum: ['CARD', 'BANK_TRANSFER', 'CRYPTO', 'DIGITAL_WALLET', 'CASH'],
    required: [true, 'Payment method type is required'],
  },
  provider: {
    type: String,
    enum: ['STRIPE', 'COINBASE', 'PLAID', 'BANK_API', 'CUSTOM'],
    required: [true, 'Payment provider is required'],
  },
  methodId: {
    type: String,
    required: [true, 'Payment method ID is required'],
    trim: true,
  },
  details: {
    // Card details
    last4: {
      type: String,
      match: [/^\d{4}$/, 'Last 4 digits must be exactly 4 numbers'],
    },
    brand: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay'],
    },
    expiryMonth: {
      type: Number,
      min: 1,
      max: 12,
    },
    expiryYear: {
      type: Number,
      min: new Date().getFullYear(),
    },
    
    // Bank details
    bankName: String,
    accountLast4: {
      type: String,
      match: [/^\d{4}$/, 'Account last 4 digits must be exactly 4 numbers'],
    },
    routingNumber: {
      type: String,
      match: [/^\d{9}$/, 'Routing number must be exactly 9 digits'],
    },
    
    // Crypto details
    cryptoCurrency: {
      type: String,
      uppercase: true,
      enum: ['BTC', 'ETH', 'LTC', 'BCH', 'USDC', 'USDT'],
    },
    walletAddress: {
      type: String,
      trim: true,
    },
    
    // Digital wallet
    walletProvider: {
      type: String,
      enum: ['apple_pay', 'google_pay', 'paypal', 'venmo', 'cashapp'],
    },
    walletId: String,
    
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
}, { _id: false });

const TransactionTimelineSchema = new Schema<ITransactionTimeline>({
  status: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  message: {
    type: String,
    trim: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, { _id: false });

const TransactionSchema = new Schema<ITransaction>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      index: true,
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Initiator is required'],
      index: true,
    },
    transactionId: {
      type: String,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['PAYMENT', 'REFUND', 'TRANSFER', 'SETTLEMENT', 'AUTHORIZATION', 'CAPTURE'],
      required: [true, 'Transaction type is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'AUTHORIZED', 'CAPTURED', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'DISPUTED'],
      default: 'PENDING',
      index: true,
    },
    amount: {
      value: {
        type: Number,
        required: [true, 'Amount value is required'],
        min: [0, 'Amount cannot be negative'],
      },
      currency: {
        type: String,
        required: [true, 'Currency is required'],
        uppercase: true,
        length: 3,
      },
      precision: {
        type: Number,
        default: 2,
        min: 0,
        max: 8,
      },
    },
    fees: {
      platform: {
        type: Number,
        default: 0,
        min: 0,
      },
      payment: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
      currency: {
        type: String,
        required: [true, 'Fee currency is required'],
        uppercase: true,
        length: 3,
      },
    },
    netAmount: {
      type: Number,
      required: [true, 'Net amount is required'],
      min: 0,
    },
    paymentMethod: {
      type: PaymentMethodSchema,
      required: [true, 'Payment method is required'],
    },
    mandateChain: [{
      type: Schema.Types.ObjectId,
      ref: 'Mandate',
    }],
    
    parties: {
      payer: {
        type: {
          type: String,
          enum: ['USER', 'AGENT', 'EXTERNAL'],
          required: true,
        },
        id: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        name: {
          type: String,
          required: [true, 'Payer name is required'],
          trim: true,
        },
        email: {
          type: String,
          lowercase: true,
          trim: true,
          match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
        },
      },
      payee: {
        type: {
          type: String,
          enum: ['MERCHANT', 'USER', 'PLATFORM', 'EXTERNAL'],
          required: true,
        },
        id: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        name: {
          type: String,
          required: [true, 'Payee name is required'],
          trim: true,
        },
        email: {
          type: String,
          lowercase: true,
          trim: true,
          match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        merchantId: {
          type: String,
          trim: true,
        },
        address: {
          street: String,
          city: String,
          state: String,
          country: String,
          postalCode: String,
        },
      },
    },
    
    externalProvider: {
      provider: {
        type: String,
        required: [true, 'External provider is required'],
        trim: true,
        lowercase: true,
      },
      providerId: {
        type: String,
        required: [true, 'Provider ID is required'],
        trim: true,
        index: true,
      },
      providerStatus: {
        type: String,
        trim: true,
      },
      providerResponse: {
        type: Schema.Types.Mixed,
        default: {},
      },
      webhookData: [{
        type: Schema.Types.Mixed,
      }],
    },
    
    metadata: {
      description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
      },
      reference: {
        type: String,
        trim: true,
        index: true,
      },
      invoiceId: {
        type: String,
        trim: true,
        index: true,
      },
      orderId: {
        type: String,
        trim: true,
        index: true,
      },
      tags: [{
        type: String,
        trim: true,
        lowercase: true,
      }],
      agentExecutionId: {
        type: Schema.Types.ObjectId,
        index: true,
      },
      userAgent: String,
      ipAddress: {
        type: String,
        match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, 'Invalid IP address'],
      },
      deviceFingerprint: String,
    },
    
    riskAssessment: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      level: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'BLOCKED'],
        default: 'LOW',
        index: true,
      },
      reasons: [{
        type: String,
        trim: true,
      }],
      reviewRequired: {
        type: Boolean,
        default: false,
        index: true,
      },
      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      reviewedAt: Date,
      reviewNotes: {
        type: String,
        trim: true,
      },
    },
    
    timeline: {
      type: [TransactionTimelineSchema],
      default: [],
    },
    
    errorDetails: {
      code: {
        type: String,
        trim: true,
      },
      message: {
        type: String,
        trim: true,
      },
      providerCode: {
        type: String,
        trim: true,
      },
      providerMessage: {
        type: String,
        trim: true,
      },
      retryable: {
        type: Boolean,
        default: false,
      },
      retryCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastRetryAt: Date,
    },
    
    settlement: {
      status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'SETTLED', 'FAILED'],
        default: 'PENDING',
        index: true,
      },
      scheduledAt: Date,
      settledAt: Date,
      settlementId: {
        type: String,
        trim: true,
      },
      bankFees: {
        type: Number,
        min: 0,
      },
    },
    
    parentTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      index: true,
    },
    childTransactions: [{
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    }],
    
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
TransactionSchema.index({ tenantId: 1, status: 1 });
TransactionSchema.index({ tenantId: 1, type: 1 });
TransactionSchema.index({ tenantId: 1, createdAt: -1 });
TransactionSchema.index({ tenantId: 1, 'amount.value': -1 });
TransactionSchema.index({ 'externalProvider.provider': 1, 'externalProvider.providerId': 1 });
TransactionSchema.index({ 'metadata.reference': 1 });
TransactionSchema.index({ 'metadata.invoiceId': 1 });
TransactionSchema.index({ agentId: 1, status: 1 });

// Virtual: isRefundable
TransactionSchema.virtual('isRefundable').get(function (this: ITransaction) {
  return ['COMPLETED', 'CAPTURED'].includes(this.status) && 
         this.type !== 'REFUND' &&
         this.childTransactions.length === 0;
});

// Virtual: isCapturable
TransactionSchema.virtual('isCapturable').get(function (this: ITransaction) {
  return this.status === 'AUTHORIZED' && this.type === 'AUTHORIZATION';
});

// Virtual: isCancellable
TransactionSchema.virtual('isCancellable').get(function (this: ITransaction) {
  return ['PENDING', 'PROCESSING', 'AUTHORIZED'].includes(this.status);
});

// Pre-save middleware: Generate transaction ID
TransactionSchema.pre('save', function (next) {
  if (this.isNew && !this.transactionId) {
    // Generate unique transaction ID: TXN_YYYYMMDD_RANDOMSTRING
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.transactionId = `TXN_${date}_${random}`;
  }
  next();
});

// Pre-save middleware: Calculate net amount
TransactionSchema.pre('save', function (next) {
  if (this.isModified('amount') || this.isModified('fees')) {
    this.netAmount = this.calculateNetAmount();
  }
  next();
});

// Pre-save middleware: Add initial timeline event
TransactionSchema.pre('save', function (next) {
  if (this.isNew) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      message: `Transaction created with status: ${this.status}`,
      metadata: {
        initiatedBy: this.initiatedBy,
        type: this.type,
      },
    });
  }
  next();
});

// Method: Add timeline event
TransactionSchema.methods.addTimelineEvent = async function (
  this: ITransaction,
  status: string,
  message?: string,
  metadata?: Record<string, any>
): Promise<void> {
  this.timeline.push({
    status,
    timestamp: new Date(),
    message,
    metadata: metadata || {},
  });
  await this.save();
};

// Method: Update status
TransactionSchema.methods.updateStatus = async function (
  this: ITransaction,
  newStatus: string,
  message?: string
): Promise<void> {
  const oldStatus = this.status;
  this.status = newStatus as any;
  
  await this.addTimelineEvent(
    newStatus,
    message || `Status changed from ${oldStatus} to ${newStatus}`,
    { previousStatus: oldStatus }
  );
};

// Method: Can refund
TransactionSchema.methods.canRefund = function (this: ITransaction): boolean {
  return this.isRefundable as boolean;
};

// Method: Can capture
TransactionSchema.methods.canCapture = function (this: ITransaction): boolean {
  return this.isCapturable as boolean;
};

// Method: Can cancel
TransactionSchema.methods.canCancel = function (this: ITransaction): boolean {
  return this.isCancellable as boolean;
};

// Method: Calculate net amount
TransactionSchema.methods.calculateNetAmount = function (this: ITransaction): number {
  return this.amount.value - this.fees.total;
};

const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
