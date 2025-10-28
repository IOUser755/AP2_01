import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';

export interface IMandateSignature {
  algorithm: 'ECDSA' | 'RSA' | 'ED25519';
  publicKey: string;
  signature: string;
  timestamp: Date;
  keyId: string; // Key identifier for key rotation
}

export interface IMandateChain {
  previous?: Types.ObjectId; // Previous mandate in chain
  next?: Types.ObjectId; // Next mandate in chain (for linked mandates)
  chainId: string; // Unique identifier for the entire chain
  sequenceNumber: number; // Position in chain (0 = first)
}

export interface IMandate extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  transactionId?: Types.ObjectId; // Optional - mandates can exist without transactions
  agentId?: Types.ObjectId; // Agent that created this mandate
  createdBy: Types.ObjectId; // User who approved/created mandate
  
  // Mandate identification
  mandateId: string; // Unique mandate identifier
  type: 'INTENT' | 'CART' | 'PAYMENT' | 'APPROVAL' | 'CANCELLATION';
  version: string; // Semantic version
  
  // Mandate content
  content: {
    // Intent information
    intent: {
      action: string; // 'buy', 'sell', 'transfer', 'approve', etc.
      description: string; // Human-readable description
      context: Record<string, any>; // Additional context
    };
    
    // Transaction details (for payment mandates)
    transaction?: {
      amount: {
        value: number;
        currency: string;
      };
      recipient: {
        type: 'MERCHANT' | 'USER' | 'AGENT' | 'EXTERNAL';
        id?: string;
        name: string;
        address?: Record<string, any>;
      };
      items?: Array<{
        id: string;
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        metadata?: Record<string, any>;
      }>;
      taxes?: {
        amount: number;
        rate: number;
        jurisdiction: string;
      };
      shipping?: {
        amount: number;
        method: string;
        address: Record<string, any>;
      };
    };
    
    // Authorization and constraints
    authorization: {
      maxAmount?: {
        value: number;
        currency: string;
      };
      validUntil?: Date;
      validFrom?: Date;
      geoRestrictions?: string[]; // Country codes
      timeRestrictions?: {
        allowedDays: number[]; // 0-6, Sunday-Saturday
        allowedHours: {
          start: string; // HH:MM format
          end: string;
        };
        timeZone: string;
      };
      requiresApproval: boolean;
      approvalLevel: 'USER' | 'ADMIN' | 'SYSTEM';
    };
    
    // Risk and compliance
    compliance: {
      amlCheck: boolean;
      sanctions: boolean;
      fraudCheck: boolean;
      riskScore?: number;
      complianceNotes?: string;
    };
  };
  
  // Cryptographic proof
  cryptography: {
    hash: string; // SHA-256 hash of mandate content
    hashAlgorithm: string;
    signatures: IMandateSignature[]; // Multiple signatures for multi-party approval
    merkleRoot?: string; // For batch mandates
    merkleProof?: string[];
  };
  
  // Chain and relationships
  chain: IMandateChain;
  
  // Status and lifecycle
  status: 'PENDING' | 'APPROVED' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  approvals: Array<{
    userId: Types.ObjectId;
    role: string;
    approvedAt: Date;
    signature?: IMandateSignature;
    notes?: string;
  }>;
  
  // Execution details
  execution: {
    executedAt?: Date;
    executedBy?: Types.ObjectId; // User or system
    executionResult?: {
      success: boolean;
      transactionId?: string;
      errorCode?: string;
      errorMessage?: string;
      metadata?: Record<string, any>;
    };
    rollbackInfo?: {
      canRollback: boolean;
      rollbackTransactionId?: string;
      rollbackReason?: string;
    };
  };
  
  // Metadata and audit
  metadata: {
    source: 'USER' | 'AGENT' | 'SYSTEM' | 'API';
    userAgent?: string;
    ipAddress?: string;
    deviceFingerprint?: string;
    sessionId?: string;
    correlationId?: string; // For tracing across services
    tags: string[];
  };
  
  // Expiration and cleanup
  expiresAt?: Date;
  autoExecute: boolean; // Whether to execute automatically when approved
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  generateHash(): string;
  addSignature(signature: IMandateSignature): Promise<void>;
  isValid(): boolean;
  canExecute(): boolean;
  canApprove(userId: Types.ObjectId): boolean;
  addApproval(userId: Types.ObjectId, role: string, notes?: string): Promise<void>;
  execute(executedBy: Types.ObjectId, result: any): Promise<void>;
}

const MandateSignatureSchema = new Schema<IMandateSignature>({
  algorithm: {
    type: String,
    enum: ['ECDSA', 'RSA', 'ED25519'],
    required: [true, 'Signature algorithm is required'],
  },
  publicKey: {
    type: String,
    required: [true, 'Public key is required'],
    trim: true,
  },
  signature: {
    type: String,
    required: [true, 'Signature is required'],
    trim: true,
  },
  timestamp: {
    type: Date,
    required: [true, 'Signature timestamp is required'],
    default: Date.now,
  },
  keyId: {
    type: String,
    required: [true, 'Key ID is required'],
    trim: true,
  },
}, { _id: false });

const MandateChainSchema = new Schema<IMandateChain>({
  previous: {
    type: Schema.Types.ObjectId,
    ref: 'Mandate',
  },
  next: {
    type: Schema.Types.ObjectId,
    ref: 'Mandate',
  },
  chainId: {
    type: String,
    required: [true, 'Chain ID is required'],
    trim: true,
    index: true,
  },
  sequenceNumber: {
    type: Number,
    required: [true, 'Sequence number is required'],
    min: [0, 'Sequence number cannot be negative'],
  },
}, { _id: false });

const MandateSchema = new Schema<IMandate>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      index: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true,
    },
    
    mandateId: {
      type: String,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['INTENT', 'CART', 'PAYMENT', 'APPROVAL', 'CANCELLATION'],
      required: [true, 'Mandate type is required'],
      index: true,
    },
    version: {
      type: String,
      default: '1.0.0',
      match: [/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning'],
    },
    
    content: {
      intent: {
        action: {
          type: String,
          required: [true, 'Intent action is required'],
          trim: true,
          lowercase: true,
        },
        description: {
          type: String,
          required: [true, 'Intent description is required'],
          trim: true,
          maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        context: {
          type: Schema.Types.Mixed,
          default: {},
        },
      },
      
      transaction: {
        amount: {
          value: {
            type: Number,
            min: [0, 'Amount cannot be negative'],
          },
          currency: {
            type: String,
            uppercase: true,
            length: 3,
          },
        },
        recipient: {
          type: {
            type: String,
            enum: ['MERCHANT', 'USER', 'AGENT', 'EXTERNAL'],
          },
          id: String,
          name: {
            type: String,
            trim: true,
          },
          address: Schema.Types.Mixed,
        },
        items: [{
          id: {
            type: String,
            required: true,
            trim: true,
          },
          name: {
            type: String,
            required: true,
            trim: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
          },
          unitPrice: {
            type: Number,
            required: true,
            min: 0,
          },
          totalPrice: {
            type: Number,
            required: true,
            min: 0,
          },
          metadata: Schema.Types.Mixed,
        }],
        taxes: {
          amount: {
            type: Number,
            min: 0,
          },
          rate: {
            type: Number,
            min: 0,
            max: 1,
          },
          jurisdiction: String,
        },
        shipping: {
          amount: {
            type: Number,
            min: 0,
          },
          method: String,
          address: Schema.Types.Mixed,
        },
      },
      
      authorization: {
        maxAmount: {
          value: {
            type: Number,
            min: 0,
          },
          currency: {
            type: String,
            uppercase: true,
            length: 3,
          },
        },
        validUntil: Date,
        validFrom: Date,
        geoRestrictions: [String],
        timeRestrictions: {
          allowedDays: [{
            type: Number,
            min: 0,
            max: 6,
          }],
          allowedHours: {
            start: {
              type: String,
              match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'],
            },
            end: {
              type: String,
              match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'],
            },
          },
          timeZone: {
            type: String,
            default: 'UTC',
          },
        },
        requiresApproval: {
          type: Boolean,
          default: false,
        },
        approvalLevel: {
          type: String,
          enum: ['USER', 'ADMIN', 'SYSTEM'],
          default: 'USER',
        },
      },
      
      compliance: {
        amlCheck: {
          type: Boolean,
          default: false,
        },
        sanctions: {
          type: Boolean,
          default: false,
        },
        fraudCheck: {
          type: Boolean,
          default: false,
        },
        riskScore: {
          type: Number,
          min: 0,
          max: 100,
        },
        complianceNotes: {
          type: String,
          trim: true,
        },
      },
    },
    
    cryptography: {
      hash: {
        type: String,
        required: [true, 'Mandate hash is required'],
        trim: true,
        index: true,
      },
      hashAlgorithm: {
        type: String,
        default: 'SHA-256',
        enum: ['SHA-256', 'SHA-512', 'BLAKE2b'],
      },
      signatures: {
        type: [MandateSignatureSchema],
        validate: {
          validator: function(signatures: IMandateSignature[]) {
            return signatures.length > 0;
          },
          message: 'At least one signature is required',
        },
      },
      merkleRoot: {
        type: String,
        trim: true,
      },
      merkleProof: [String],
    },
    
    chain: {
      type: MandateChainSchema,
      required: [true, 'Chain information is required'],
    },
    
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'EXECUTED', 'EXPIRED', 'CANCELLED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    
    approvals: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        required: true,
        trim: true,
      },
      approvedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      signature: MandateSignatureSchema,
      notes: {
        type: String,
        trim: true,
      },
    }],
    
    execution: {
      executedAt: Date,
      executedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      executionResult: {
        success: {
          type: Boolean,
          required: function() {
            return this.execution?.executedAt != null;
          },
        },
        transactionId: String,
        errorCode: String,
        errorMessage: String,
        metadata: Schema.Types.Mixed,
      },
      rollbackInfo: {
        canRollback: {
          type: Boolean,
          default: false,
        },
        rollbackTransactionId: String,
        rollbackReason: String,
      },
    },
    
    metadata: {
      source: {
        type: String,
        enum: ['USER', 'AGENT', 'SYSTEM', 'API'],
        required: [true, 'Source is required'],
        index: true,
      },
      userAgent: String,
      ipAddress: String,
      deviceFingerprint: String,
      sessionId: {
        type: String,
        index: true,
      },
      correlationId: {
        type: String,
        index: true,
      },
      tags: [{
        type: String,
        trim: true,
        lowercase: true,
      }],
    },
    
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index
    },
    
    autoExecute: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance and uniqueness
MandateSchema.index({ tenantId: 1, status: 1 });
MandateSchema.index({ tenantId: 1, type: 1 });
MandateSchema.index({ tenantId: 1, createdAt: -1 });
MandateSchema.index({ 'chain.chainId': 1, 'chain.sequenceNumber': 1 });
MandateSchema.index({ transactionId: 1 });
MandateSchema.index({ agentId: 1, status: 1 });
MandateSchema.index({ 'metadata.correlationId': 1 });

// Virtual: isExpired
MandateSchema.virtual('isExpired').get(function (this: IMandate) {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

// Virtual: needsApproval
MandateSchema.virtual('needsApproval').get(function (this: IMandate) {
  return this.content.authorization.requiresApproval && 
         this.status === 'PENDING' && 
         this.approvals.length === 0;
});

// Virtual: canExecuteNow
MandateSchema.virtual('canExecuteNow').get(function (this: IMandate) {
  return this.status === 'APPROVED' && 
         !this.isExpired && 
         (!this.content.authorization.requiresApproval || this.approvals.length > 0);
});

// Pre-save middleware: Generate mandate ID
MandateSchema.pre('save', function (next) {
  if (this.isNew && !this.mandateId) {
    // Generate unique mandate ID: MND_YYYYMMDD_TYPE_SEQUENCE
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.mandateId = `MND_${date}_${this.type}_${random}`;
  }
  next();
});

// Pre-save middleware: Generate chain ID if new chain
MandateSchema.pre('save', function (next) {
  if (this.isNew && !this.chain.chainId) {
    // Generate unique chain ID: CHN_YYYYMMDD_RANDOMSTRING
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.chain.chainId = `CHN_${date}_${random}`;
    this.chain.sequenceNumber = 0; // First in chain
  }
  next();
});

// Pre-save middleware: Generate hash
MandateSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('content')) {
    this.cryptography.hash = this.generateHash();
  }
  next();
});

// Method: Generate hash
MandateSchema.methods.generateHash = function (this: IMandate): string {
  const content = JSON.stringify({
    mandateId: this.mandateId,
    type: this.type,
    content: this.content,
    chain: this.chain,
    createdAt: this.createdAt,
  });
  
  return crypto.createHash('sha256').update(content).digest('hex');
};

// Method: Add signature
MandateSchema.methods.addSignature = async function (
  this: IMandate,
  signature: IMandateSignature
): Promise<void> {
  this.cryptography.signatures.push(signature);
  await this.save();
};

// Method: Is valid
MandateSchema.methods.isValid = function (this: IMandate): boolean {
  // Check expiration
  if (this.isExpired) return false;
  
  // Check if hash matches content
  const currentHash = this.generateHash();
  if (currentHash !== this.cryptography.hash) return false;
  
  // Check signatures
  if (this.cryptography.signatures.length === 0) return false;
  
  // Additional validation logic would go here
  // (e.g., verify signatures, check constraints)
  
  return true;
};

// Method: Can execute
MandateSchema.methods.canExecute = function (this: IMandate): boolean {
  return this.canExecuteNow as boolean;
};

// Method: Can approve
MandateSchema.methods.canApprove = function (
  this: IMandate,
  userId: Types.ObjectId
): boolean {
  if (this.status !== 'PENDING') return false;
  if (!this.content.authorization.requiresApproval) return false;
  
  // Check if user already approved
  const existingApproval = this.approvals.find(
    approval => approval.userId.toString() === userId.toString()
  );
  
  return !existingApproval;
};

// Method: Add approval
MandateSchema.methods.addApproval = async function (
  this: IMandate,
  userId: Types.ObjectId,
  role: string,
  notes?: string
): Promise<void> {
  if (!this.canApprove(userId)) {
    throw new Error('User cannot approve this mandate');
  }
  
  this.approvals.push({
    userId,
    role,
    approvedAt: new Date(),
    notes,
  });
  
  // Check if mandate should be auto-approved
  const requiredApprovals = 1; // Could be configurable
  if (this.approvals.length >= requiredApprovals) {
    this.status = 'APPROVED';
  }
  
  await this.save();
};

// Method: Execute mandate
MandateSchema.methods.execute = async function (
  this: IMandate,
  executedBy: Types.ObjectId,
  result: {
    success: boolean;
    transactionId?: string;
    errorCode?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  if (!this.canExecute()) {
    throw new Error('Mandate cannot be executed');
  }
  
  this.execution.executedAt = new Date();
  this.execution.executedBy = executedBy;
  this.execution.executionResult = result;
  this.status = 'EXECUTED';
  
  await this.save();
};

const Mandate = mongoose.model<IMandate>('Mandate', MandateSchema);

export default Mandate;
