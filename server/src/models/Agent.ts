import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWorkflowStep {
  id: string;
  type: 'TRIGGER' | 'ACTION' | 'CONDITION' | 'APPROVAL';
  name: string;
  description?: string;
  toolType: string; // e.g., 'search_products', 'payment_stripe', 'approval_human'
  parameters: Record<string, any>;
  position: { x: number; y: number };
  connections: {
    success?: string; // Next step ID on success
    failure?: string; // Next step ID on failure
    conditions?: Array<{
      condition: string;
      nextStepId: string;
    }>;
  };
  errorHandling: {
    strategy: 'STOP' | 'CONTINUE' | 'RETRY' | 'ROLLBACK';
    maxRetries?: number;
    fallbackStepId?: string;
  };
  timeout?: number; // milliseconds
}

export interface IAgentConfiguration {
  workflow: IWorkflowStep[];
  tools: Array<{
    type: string;
    name: string;
    config: Record<string, any>;
    enabled: boolean;
  }>;
  triggers: Array<{
    type: 'WEBHOOK' | 'SCHEDULE' | 'MANUAL' | 'EVENT';
    config: Record<string, any>;
    enabled: boolean;
  }>;
  variables: Record<string, any>;
  constraints: {
    budgetLimit?: {
      amount: number;
      currency: string;
      period: 'TRANSACTION' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    };
    timeLimit?: {
      maxExecutionTime: number; // minutes
      timeZone: string;
    };
    approvalRequired: boolean;
    geoRestrictions?: string[]; // Country codes
  };
  notifications: {
    onStart: boolean;
    onComplete: boolean;
    onError: boolean;
    onApprovalNeeded: boolean;
    channels: Array<{
      type: 'EMAIL' | 'WEBHOOK' | 'SLACK' | 'SMS';
      config: Record<string, any>;
    }>;
  };
}

export interface IAgentMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number; // milliseconds
  lastExecutionTime?: number;
  totalAmountProcessed?: {
    amount: number;
    currency: string;
  };
  costMetrics: {
    totalCost: number;
    averageCostPerExecution: number;
    currency: string;
  };
}

export interface IAgent extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  createdBy: Types.ObjectId;
  name: string;
  description?: string;
  type: 'PAYMENT' | 'WORKFLOW' | 'DATA_PROCESSOR' | 'NOTIFICATION' | 'CUSTOM';
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'ERROR';
  version: string;
  templateId?: Types.ObjectId; // Reference to AgentTemplate if created from template
  configuration: IAgentConfiguration;
  metadata: {
    tags: string[];
    category: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    environment: 'SANDBOX' | 'PRODUCTION';
  };
  metrics: IAgentMetrics;
  lastExecutedAt?: Date;
  lastModifiedBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  canExecute(): boolean;
  incrementExecutionCount(): Promise<void>;
  updateMetrics(executionResult: any): Promise<void>;
  createExecution(context: any): Promise<any>;
}

const WorkflowStepSchema = new Schema<IWorkflowStep>({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['TRIGGER', 'ACTION', 'CONDITION', 'APPROVAL'],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  toolType: {
    type: String,
    required: true,
    trim: true,
  },
  parameters: {
    type: Schema.Types.Mixed,
    default: {},
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  connections: {
    success: String,
    failure: String,
    conditions: [{
      condition: { type: String, required: true },
      nextStepId: { type: String, required: true },
    }],
  },
  errorHandling: {
    strategy: {
      type: String,
      enum: ['STOP', 'CONTINUE', 'RETRY', 'ROLLBACK'],
      default: 'STOP',
    },
    maxRetries: {
      type: Number,
      min: 0,
      max: 10,
      default: 3,
    },
    fallbackStepId: String,
  },
  timeout: {
    type: Number,
    min: 1000, // 1 second minimum
    max: 300000, // 5 minutes maximum
    default: 30000, // 30 seconds default
  },
}, { _id: false });

const AgentConfigurationSchema = new Schema<IAgentConfiguration>({
  workflow: {
    type: [WorkflowStepSchema],
    required: true,
    validate: {
      validator: function(workflow: IWorkflowStep[]) {
        // Must have at least one step
        if (workflow.length === 0) return false;
        
        // Must have exactly one trigger step
        const triggers = workflow.filter(step => step.type === 'TRIGGER');
        if (triggers.length !== 1) return false;
        
        // All step IDs must be unique
        const ids = workflow.map(step => step.id);
        return ids.length === new Set(ids).size;
      },
      message: 'Workflow must have at least one step, exactly one trigger, and unique step IDs',
    },
  },
  tools: [{
    type: { type: String, required: true },
    name: { type: String, required: true },
    config: { type: Schema.Types.Mixed, default: {} },
    enabled: { type: Boolean, default: true },
  }],
  triggers: [{
    type: {
      type: String,
      enum: ['WEBHOOK', 'SCHEDULE', 'MANUAL', 'EVENT'],
      required: true,
    },
    config: { type: Schema.Types.Mixed, required: true },
    enabled: { type: Boolean, default: true },
  }],
  variables: {
    type: Schema.Types.Mixed,
    default: {},
  },
  constraints: {
    budgetLimit: {
      amount: { type: Number, min: 0 },
      currency: { type: String, uppercase: true, length: 3 },
      period: {
        type: String,
        enum: ['TRANSACTION', 'DAILY', 'WEEKLY', 'MONTHLY'],
        default: 'MONTHLY',
      },
    },
    timeLimit: {
      maxExecutionTime: {
        type: Number,
        min: 1,
        max: 1440, // 24 hours in minutes
        default: 60,
      },
      timeZone: {
        type: String,
        default: 'UTC',
      },
    },
    approvalRequired: {
      type: Boolean,
      default: false,
    },
    geoRestrictions: [String], // ISO country codes
  },
  notifications: {
    onStart: { type: Boolean, default: false },
    onComplete: { type: Boolean, default: true },
    onError: { type: Boolean, default: true },
    onApprovalNeeded: { type: Boolean, default: true },
    channels: [{
      type: {
        type: String,
        enum: ['EMAIL', 'WEBHOOK', 'SLACK', 'SMS'],
        required: true,
      },
      config: { type: Schema.Types.Mixed, required: true },
    }],
  },
}, { _id: false });

const AgentMetricsSchema = new Schema<IAgentMetrics>({
  totalExecutions: {
    type: Number,
    default: 0,
    min: 0,
  },
  successfulExecutions: {
    type: Number,
    default: 0,
    min: 0,
  },
  failedExecutions: {
    type: Number,
    default: 0,
    min: 0,
  },
  averageExecutionTime: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastExecutionTime: {
    type: Number,
    min: 0,
  },
  totalAmountProcessed: {
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      uppercase: true,
      length: 3,
      default: 'USD',
    },
  },
  costMetrics: {
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageCostPerExecution: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      uppercase: true,
      length: 3,
      default: 'USD',
    },
  },
}, { _id: false });

const AgentSchema = new Schema<IAgent>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
      minlength: [2, 'Agent name must be at least 2 characters'],
      maxlength: [100, 'Agent name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['PAYMENT', 'WORKFLOW', 'DATA_PROCESSOR', 'NOTIFICATION', 'CUSTOM'],
      required: [true, 'Agent type is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED', 'ERROR'],
      default: 'DRAFT',
      index: true,
    },
    version: {
      type: String,
      default: '1.0.0',
      match: [/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning (x.y.z)'],
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentTemplate',
      index: true,
    },
    configuration: {
      type: AgentConfigurationSchema,
      required: [true, 'Agent configuration is required'],
    },
    metadata: {
      tags: [{
        type: String,
        trim: true,
        lowercase: true,
      }],
      category: {
        type: String,
        trim: true,
        default: 'general',
        index: true,
      },
      priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM',
        index: true,
      },
      environment: {
        type: String,
        enum: ['SANDBOX', 'PRODUCTION'],
        default: 'SANDBOX',
        index: true,
      },
    },
    metrics: {
      type: AgentMetricsSchema,
      default: () => ({}),
    },
    lastExecutedAt: {
      type: Date,
      index: true,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Last modified by is required'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
AgentSchema.index({ tenantId: 1, status: 1 });
AgentSchema.index({ tenantId: 1, type: 1 });
AgentSchema.index({ tenantId: 1, 'metadata.category': 1 });
AgentSchema.index({ tenantId: 1, 'metadata.tags': 1 });
AgentSchema.index({ tenantId: 1, createdBy: 1 });
AgentSchema.index({ tenantId: 1, name: 1 }, { unique: true });
AgentSchema.index({ lastExecutedAt: -1 });

// Virtual: successRate
AgentSchema.virtual('successRate').get(function (this: IAgent) {
  if (this.metrics.totalExecutions === 0) return 0;
  return (this.metrics.successfulExecutions / this.metrics.totalExecutions) * 100;
});

// Virtual: isActive
AgentSchema.virtual('isActive').get(function (this: IAgent) {
  return this.status === 'ACTIVE';
});

// Virtual: canEdit
AgentSchema.virtual('canEdit').get(function (this: IAgent) {
  return ['DRAFT', 'PAUSED'].includes(this.status);
});

// Method: Can execute
AgentSchema.methods.canExecute = function (this: IAgent): boolean {
  return this.status === 'ACTIVE' && !this.isDeleted;
};

// Method: Increment execution count
AgentSchema.methods.incrementExecutionCount = async function (this: IAgent): Promise<void> {
  this.metrics.totalExecutions++;
  this.lastExecutedAt = new Date();
  await this.save();
};

// Method: Update metrics
AgentSchema.methods.updateMetrics = async function (
  this: IAgent,
  executionResult: {
    success: boolean;
    duration: number;
    cost?: number;
    amountProcessed?: { amount: number; currency: string };
  }
): Promise<void> {
  const metrics = this.metrics;
  
  if (executionResult.success) {
    metrics.successfulExecutions++;
  } else {
    metrics.failedExecutions++;
  }
  
  // Update average execution time
  const totalTime = metrics.averageExecutionTime * (metrics.totalExecutions - 1) + executionResult.duration;
  metrics.averageExecutionTime = totalTime / metrics.totalExecutions;
  metrics.lastExecutionTime = executionResult.duration;
  
  // Update cost metrics
  if (executionResult.cost) {
    metrics.costMetrics.totalCost += executionResult.cost;
    metrics.costMetrics.averageCostPerExecution = 
      metrics.costMetrics.totalCost / metrics.totalExecutions;
  }
  
  // Update amount processed
  if (executionResult.amountProcessed) {
    if (metrics.totalAmountProcessed.currency === executionResult.amountProcessed.currency) {
      metrics.totalAmountProcessed.amount += executionResult.amountProcessed.amount;
    }
  }
  
  await this.save();
};

// Method: Create execution record
AgentSchema.methods.createExecution = async function (
  this: IAgent,
  context: any
): Promise<any> {
  // This will be implemented when we create the AgentExecution model
  // For now, return a placeholder
  return {
    agentId: this._id,
    tenantId: this.tenantId,
    status: 'PENDING',
    context,
    createdAt: new Date(),
  };
};

// Pre-save middleware: Update lastModifiedBy on changes
AgentSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    // lastModifiedBy should be set by the calling code
    // This is just a safety check
    if (!this.lastModifiedBy) {
      return next(new Error('lastModifiedBy is required when updating agent'));
    }
  }
  next();
});

const Agent = mongoose.model<IAgent>('Agent', AgentSchema);

export default Agent;
