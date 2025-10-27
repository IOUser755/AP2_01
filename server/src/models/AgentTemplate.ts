import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAgentConfiguration } from './Agent.js';

export interface IAgentTemplate extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  publishedBy: Types.ObjectId | 'platform'; // tenantId or 'platform' for official templates
  templateConfig: IAgentConfiguration;
  usageCount: number;
  rating: {
    average: number;
    totalReviews: number;
  };
  price: {
    amount: number;
    currency: string;
    type: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION';
  };
  screenshots: string[]; // URLs to template screenshots
  documentation: {
    readme: string;
    setupInstructions: string;
    examples: Array<{
      name: string;
      description: string;
      configuration: Record<string, any>;
    }>;
  };
  version: string;
  changelog: Array<{
    version: string;
    changes: string[];
    releasedAt: Date;
  }>;
  compatibility: {
    minPlatformVersion: string;
    supportedTools: string[];
    requiredPermissions: string[];
  };
  isActive: boolean;
  featuredAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  canBeUsedBy(tenantId: Types.ObjectId): boolean;
  incrementUsage(): Promise<void>;
  addReview(rating: number): Promise<void>;
}

const AgentTemplateSchema = new Schema<IAgentTemplate>(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      minlength: [3, 'Template name must be at least 3 characters'],
      maxlength: [100, 'Template name cannot exceed 100 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Template description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
      enum: [
        'payment',
        'e-commerce',
        'finance',
        'data-processing',
        'notification',
        'workflow',
        'integration',
        'custom'
      ],
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [30, 'Tag cannot exceed 30 characters'],
    }],
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedBy: {
      type: Schema.Types.Mixed, // Can be ObjectId or string 'platform'
      required: [true, 'Publisher is required'],
      index: true,
    },
    templateConfig: {
      type: Schema.Types.Mixed, // Using IAgentConfiguration structure
      required: [true, 'Template configuration is required'],
      validate: {
        validator: function(config: any) {
          // Basic validation - ensure required fields exist
          return config && 
                 Array.isArray(config.workflow) && 
                 config.workflow.length > 0 &&
                 Array.isArray(config.tools);
        },
        message: 'Template configuration must have workflow and tools',
      },
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative'],
      index: true,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5'],
      },
      totalReviews: {
        type: Number,
        default: 0,
        min: [0, 'Total reviews cannot be negative'],
      },
    },
    price: {
      amount: {
        type: Number,
        required: [true, 'Price amount is required'],
        min: [0, 'Price cannot be negative'],
      },
      currency: {
        type: String,
        required: [true, 'Currency is required'],
        uppercase: true,
        length: 3,
        default: 'USD',
      },
      type: {
        type: String,
        enum: ['FREE', 'ONE_TIME', 'SUBSCRIPTION'],
        required: [true, 'Price type is required'],
        default: 'FREE',
      },
    },
    screenshots: [{
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Screenshot must be a valid URL'],
    }],
    documentation: {
      readme: {
        type: String,
        required: [true, 'README is required'],
        trim: true,
        minlength: [50, 'README must be at least 50 characters'],
      },
      setupInstructions: {
        type: String,
        required: [true, 'Setup instructions are required'],
        trim: true,
        minlength: [20, 'Setup instructions must be at least 20 characters'],
      },
      examples: [{
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
        },
        configuration: {
          type: Schema.Types.Mixed,
          required: true,
        },
      }],
    },
    version: {
      type: String,
      required: [true, 'Version is required'],
      match: [/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning (x.y.z)'],
      default: '1.0.0',
    },
    changelog: [{
      version: {
        type: String,
        required: true,
        match: [/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning'],
      },
      changes: [{
        type: String,
        required: true,
        trim: true,
      }],
      releasedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
    }],
    compatibility: {
      minPlatformVersion: {
        type: String,
        required: [true, 'Minimum platform version is required'],
        match: [/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning'],
        default: '1.0.0',
      },
      supportedTools: [{
        type: String,
        trim: true,
      }],
      requiredPermissions: [{
        type: String,
        trim: true,
      }],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    featuredAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
AgentTemplateSchema.index({ category: 1, isPublic: 1, isActive: 1 });
AgentTemplateSchema.index({ tags: 1, isPublic: 1, isActive: 1 });
AgentTemplateSchema.index({ 'rating.average': -1, usageCount: -1 });
AgentTemplateSchema.index({ featuredAt: -1 });
AgentTemplateSchema.index({ 'price.type': 1, 'price.amount': 1 });
AgentTemplateSchema.index({ publishedBy: 1, isActive: 1 });

// Text search index
AgentTemplateSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,
    description: 5,
    tags: 3
  }
});

// Virtual: isFree
AgentTemplateSchema.virtual('isFree').get(function (this: IAgentTemplate) {
  return this.price.type === 'FREE' || this.price.amount === 0;
});

// Virtual: isOfficial
AgentTemplateSchema.virtual('isOfficial').get(function (this: IAgentTemplate) {
  return this.publishedBy === 'platform';
});

// Virtual: popularity score (for ranking)
AgentTemplateSchema.virtual('popularityScore').get(function (this: IAgentTemplate) {
  // Weighted score based on usage and rating
  const usageScore = Math.log(this.usageCount + 1) * 0.3;
  const ratingScore = this.rating.average * 0.7;
  return usageScore + ratingScore;
});

// Method: Can be used by tenant
AgentTemplateSchema.methods.canBeUsedBy = function (
  this: IAgentTemplate,
  tenantId: Types.ObjectId
): boolean {
  if (!this.isActive) return false;
  if (this.isPublic) return true;
  if (this.publishedBy === 'platform') return true;
  
  // Private template - check if requesting tenant is the publisher
  return this.publishedBy.toString() === tenantId.toString();
};

// Method: Increment usage
AgentTemplateSchema.methods.incrementUsage = async function (this: IAgentTemplate): Promise<void> {
  this.usageCount++;
  await this.save();
};

// Method: Add review
AgentTemplateSchema.methods.addReview = async function (
  this: IAgentTemplate,
  rating: number
): Promise<void> {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  const currentTotal = this.rating.average * this.rating.totalReviews;
  this.rating.totalReviews++;
  this.rating.average = (currentTotal + rating) / this.rating.totalReviews;
  
  await this.save();
};

// Pre-save middleware: Validate template configuration
AgentTemplateSchema.pre('save', function (next) {
  // Ensure at least one screenshot for public templates
  if (this.isPublic && this.screenshots.length === 0) {
    return next(new Error('Public templates must have at least one screenshot'));
  }
  
  // Ensure documentation is complete for public templates
  if (this.isPublic && (!this.documentation.readme || !this.documentation.setupInstructions)) {
    return next(new Error('Public templates must have complete documentation'));
  }
  
  next();
});

const AgentTemplate = mongoose.model<IAgentTemplate>('AgentTemplate', AgentTemplateSchema);

export default AgentTemplate;
