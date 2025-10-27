import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  domain: string;
  subdomain: string;
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  website?: string;
  subscription: {
    plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIAL';
    billingCycle: 'MONTHLY' | 'YEARLY';
    amount: number;
    currency: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEnd?: Date;
    cancelledAt?: Date;
  };
  features: {
    maxAgents: number;
    maxTransactionsPerMonth: number;
    maxUsers: number;
    maxTemplates: number;
    enableMarketplace: boolean;
    enableAdvancedAnalytics: boolean;
    enableWhiteLabel: boolean;
    enablePrioritySupport: boolean;
    enableCustomDomain: boolean;
  };
  usage: {
    agentsCreated: number;
    transactionsThisMonth: number;
    usersCreated: number;
    templatesPublished: number;
    lastResetDate: Date;
  };
  compliance: {
    kycVerified: boolean;
    kycVerifiedAt?: Date;
    pciCompliant: boolean;
    pciComplianceDate?: Date;
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
    allowUserSignup: boolean;
    requireEmailVerification: boolean;
    twoFactorRequired: boolean;
  };
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  isActive: boolean;
  isOnTrial: boolean;
  daysUntilTrialEnds: number | null;
  
  // Methods
  canCreateAgent(): boolean;
  canProcessTransaction(): boolean;
  incrementUsage(field: 'agentsCreated' | 'transactionsThisMonth' | 'usersCreated' | 'templatesPublished'): Promise<void>;
  resetMonthlyUsage(): Promise<void>;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true,
      minlength: [2, 'Tenant name must be at least 2 characters'],
      maxlength: [100, 'Tenant name cannot exceed 100 characters'],
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens'],
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'],
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    companyEmail: {
      type: String,
      required: [true, 'Company email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    companyPhone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
        default: 'FREE',
      },
      status: {
        type: String,
        enum: ['ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIAL'],
        default: 'TRIAL',
      },
      billingCycle: {
        type: String,
        enum: ['MONTHLY', 'YEARLY'],
        default: 'MONTHLY',
      },
      amount: {
        type: Number,
        default: 0,
        min: [0, 'Amount cannot be negative'],
      },
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
      },
      currentPeriodStart: {
        type: Date,
        default: Date.now,
      },
      currentPeriodEnd: {
        type: Date,
        default: () => {
          const date = new Date();
          date.setMonth(date.getMonth() + 1);
          return date;
        },
      },
      trialEnd: {
        type: Date,
        default: () => {
          const date = new Date();
          date.setDate(date.getDate() + 14); // 14-day trial
          return date;
        },
      },
      cancelledAt: Date,
    },
    features: {
      maxAgents: {
        type: Number,
        default: 3,
        min: [0, 'Max agents cannot be negative'],
      },
      maxTransactionsPerMonth: {
        type: Number,
        default: 1000,
        min: [0, 'Max transactions cannot be negative'],
      },
      maxUsers: {
        type: Number,
        default: 5,
        min: [1, 'Must allow at least 1 user'],
      },
      maxTemplates: {
        type: Number,
        default: 0,
        min: [0, 'Max templates cannot be negative'],
      },
      enableMarketplace: {
        type: Boolean,
        default: false,
      },
      enableAdvancedAnalytics: {
        type: Boolean,
        default: false,
      },
      enableWhiteLabel: {
        type: Boolean,
        default: false,
      },
      enablePrioritySupport: {
        type: Boolean,
        default: false,
      },
      enableCustomDomain: {
        type: Boolean,
        default: false,
      },
    },
    usage: {
      agentsCreated: {
        type: Number,
        default: 0,
        min: [0, 'Usage cannot be negative'],
      },
      transactionsThisMonth: {
        type: Number,
        default: 0,
        min: [0, 'Usage cannot be negative'],
      },
      usersCreated: {
        type: Number,
        default: 0,
        min: [0, 'Usage cannot be negative'],
      },
      templatesPublished: {
        type: Number,
        default: 0,
        min: [0, 'Usage cannot be negative'],
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },
    compliance: {
      kycVerified: {
        type: Boolean,
        default: false,
      },
      kycVerifiedAt: Date,
      pciCompliant: {
        type: Boolean,
        default: false,
      },
      pciComplianceDate: Date,
    },
    settings: {
      timezone: {
        type: String,
        default: 'UTC',
      },
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
      },
      language: {
        type: String,
        default: 'en',
        lowercase: true,
      },
      allowUserSignup: {
        type: Boolean,
        default: true,
      },
      requireEmailVerification: {
        type: Boolean,
        default: true,
      },
      twoFactorRequired: {
        type: Boolean,
        default: false,
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false, // Don't include in queries by default
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
TenantSchema.index({ domain: 1 }, { unique: true });
TenantSchema.index({ subdomain: 1 }, { unique: true });
TenantSchema.index({ companyEmail: 1 });
TenantSchema.index({ status: 1 });
TenantSchema.index({ 'subscription.status': 1 });
TenantSchema.index({ 'subscription.plan': 1 });
TenantSchema.index({ isDeleted: 1 });

// Virtual: isActive
TenantSchema.virtual('isActive').get(function (this: ITenant) {
  return (
    this.status === 'ACTIVE' &&
    (this.subscription.status === 'ACTIVE' || this.subscription.status === 'TRIAL')
  );
});

// Virtual: isOnTrial
TenantSchema.virtual('isOnTrial').get(function (this: ITenant) {
  return (
    this.subscription.status === 'TRIAL' &&
    this.subscription.trialEnd &&
    this.subscription.trialEnd > new Date()
  );
});

// Virtual: daysUntilTrialEnds
TenantSchema.virtual('daysUntilTrialEnds').get(function (this: ITenant) {
  if (!this.subscription.trialEnd) return null;
  const diff = this.subscription.trialEnd.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Method: Check if can create agent
TenantSchema.methods.canCreateAgent = function (this: ITenant): boolean {
  if (this.features.maxAgents === -1) return true; // Unlimited
  return this.usage.agentsCreated < this.features.maxAgents;
};

// Method: Check if can process transaction
TenantSchema.methods.canProcessTransaction = function (this: ITenant): boolean {
  if (this.features.maxTransactionsPerMonth === -1) return true; // Unlimited
  return this.usage.transactionsThisMonth < this.features.maxTransactionsPerMonth;
};

// Method: Increment usage
TenantSchema.methods.incrementUsage = async function (
  this: ITenant,
  field: 'agentsCreated' | 'transactionsThisMonth' | 'usersCreated' | 'templatesPublished'
): Promise<void> {
  this.usage[field]++;
  await this.save();
};

// Method: Reset monthly usage
TenantSchema.methods.resetMonthlyUsage = async function (this: ITenant): Promise<void> {
  this.usage.transactionsThisMonth = 0;
  this.usage.lastResetDate = new Date();
  await this.save();
};

// Pre-save middleware: Normalize strings
TenantSchema.pre('save', function (next) {
  if (this.isModified('domain')) {
    this.domain = this.domain.toLowerCase().trim();
  }
  if (this.isModified('subdomain')) {
    this.subdomain = this.subdomain.toLowerCase().trim();
  }
  if (this.isModified('companyEmail')) {
    this.companyEmail = this.companyEmail.toLowerCase().trim();
  }
  next();
});

const Tenant = mongoose.model<ITenant>('Tenant', TenantSchema);

export default Tenant;
