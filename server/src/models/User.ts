import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/keys.js';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'DEVELOPER' | 'VIEWER';
  permissions: string[];
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLogin?: Date;
  loginCount: number;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  fullName: string;
  isLocked: boolean;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
  incrementLoginCount(): Promise<void>;
  recordFailedLogin(): Promise<void>;
  resetFailedLogins(): Promise<void>;
}

const UserSchema = new Schema<IUser>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    avatar: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'TENANT_ADMIN', 'DEVELOPER', 'VIEWER'],
      default: 'DEVELOPER',
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    loginCount: {
      type: Number,
      default: 0,
      min: [0, 'Login count cannot be negative'],
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: [0, 'Failed login attempts cannot be negative'],
    },
    lockedUntil: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: email + tenantId
// This allows same email across different tenants
UserSchema.index({ email: 1, tenantId: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ isDeleted: 1 });
UserSchema.index({ lastLogin: -1 });

// Virtual: fullName
UserSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual: isLocked
UserSchema.virtual('isLocked').get(function (this: IUser) {
  return this.lockedUntil ? this.lockedUntil > new Date() : false;
});

// Pre-save hook: Hash password
UserSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Pre-save hook: Normalize email
UserSchema.pre('save', function (next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Method: Compare password
UserSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  try {
    // Need to explicitly select password since it's not selected by default
    const user = await mongoose.model('User').findById(this._id).select('+password');
    if (!user) return false;
    
    return await bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Method: Generate auth token (short-lived)
UserSchema.methods.generateAuthToken = function (this: IUser): string {
  return jwt.sign(
    {
      userId: this._id.toString(),
      tenantId: this.tenantId.toString(),
      role: this.role,
      permissions: this.permissions,
    },
    config.jwtSecret,
    { expiresIn: '15m' } // 15 minutes
  );
};

// Method: Generate refresh token (long-lived)
UserSchema.methods.generateRefreshToken = function (this: IUser): string {
  return jwt.sign(
    {
      userId: this._id.toString(),
      tenantId: this.tenantId.toString(),
    },
    config.jwtRefreshSecret,
    { expiresIn: '7d' } // 7 days
  );
};

// Method: Increment login count
UserSchema.methods.incrementLoginCount = async function (this: IUser): Promise<void> {
  this.loginCount++;
  this.lastLogin = new Date();
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  await this.save();
};

// Method: Record failed login
UserSchema.methods.recordFailedLogin = async function (this: IUser): Promise<void> {
  this.failedLoginAttempts++;
  
  // Lock account after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 60 * 60 * 1000); // Lock for 1 hour
  }
  
  await this.save();
};

// Method: Reset failed logins
UserSchema.methods.resetFailedLogins = async function (this: IUser): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  await this.save();
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
