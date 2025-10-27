import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { Tenant, ITenant } from '../models/Tenant.js';
import { CustomError } from './errorHandler.js';
import { logger } from '../config/logger.js';
import redis from '../config/redis.js';
import config from '../config/keys.js';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      tenant?: ITenant;
      token?: string;
      permissions?: string[];
    }
  }
}

interface JWTPayload {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

interface RefreshTokenPayload {
  userId: string;
  tenantId: string;
  iat: number;
  exp: number;
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    
    // Check if token is blacklisted (for logout)
    if (redis.isAvailable()) {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new CustomError('Token has been revoked', 401, 'TOKEN_REVOKED');
      }
    }
    
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new CustomError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new CustomError('Invalid token', 401, 'INVALID_TOKEN');
    }
    throw error;
  }
}

/**
 * Extract token from request
 */
function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie (for web app)
  if (req.headers.cookie) {
    const tokenCookie = req.headers.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('accessToken='));
    
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }
  
  // Check query parameter (for WebSocket handshake)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }
  
  return null;
}

/**
 * Main authentication middleware
 */
const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new CustomError('Access token required', 401, 'TOKEN_REQUIRED');
    }
    
    // Verify token
    const payload = await verifyToken(token);
    
    // Load user from database
    const user = await User.findById(payload.userId)
      .populate('tenantId')
      .select('+password'); // Include password for token validation
    
    if (!user) {
      throw new CustomError('User not found', 401, 'USER_NOT_FOUND');
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new CustomError('User account is disabled', 401, 'ACCOUNT_DISABLED');
    }
    
    // Check if user is locked
    if (user.isLocked) {
      throw new CustomError('User account is locked', 401, 'ACCOUNT_LOCKED');
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      throw new CustomError('Email verification required', 401, 'EMAIL_NOT_VERIFIED');
    }
    
    // Load tenant
    const tenant = await Tenant.findById(payload.tenantId);
    if (!tenant) {
      throw new CustomError('Tenant not found', 401, 'TENANT_NOT_FOUND');
    }
    
    // Check if tenant is active
    if (!tenant.isActive) {
      throw new CustomError('Tenant account is disabled', 401, 'TENANT_DISABLED');
    }
    
    // Attach user and tenant to request
    req.user = user;
    req.tenant = tenant;
    req.token = token;
    req.permissions = payload.permissions;
    
    // Log authentication success
    logger.auth('Authentication successful', {
      userId: user._id.toString(),
      tenantId: tenant._id.toString(),
      role: user.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    next();
  } catch (error) {
    // Log authentication failure
    logger.security('Authentication failed', {
      error: (error as Error).message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    
    next(error);
  }
};

/**
 * Optional authentication middleware (doesn't throw if no token)
 */
const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      // If token exists, validate it
      await auth(req, res, next);
    } else {
      // No token, continue without authentication
      next();
    }
  } catch (error) {
    // If token is invalid, continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
    }
    
    if (!roles.includes(req.user.role)) {
      logger.security('Authorization failed - insufficient role', {
        userId: req.user._id.toString(),
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method,
      });
      
      return next(new CustomError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS'));
    }
    
    next();
  };
};

/**
 * Permission-based authorization middleware
 */
const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.permissions) {
      return next(new CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
    }
    
    const hasPermission = permissions.some(permission => 
      req.permissions!.includes(permission)
    );
    
    if (!hasPermission) {
      logger.security('Authorization failed - insufficient permissions', {
        userId: req.user._id.toString(),
        userPermissions: req.permissions,
        requiredPermissions: permissions,
        path: req.path,
        method: req.method,
      });
      
      return next(new CustomError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS'));
    }
    
    next();
  };
};

/**
 * WebSocket authentication middleware
 */
const authenticateSocket = async (socket: any, next: any): Promise<void> => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    const payload = await verifyToken(token);
    
    const user = await User.findById(payload.userId).populate('tenantId');
    if (!user || !user.isActive || !user.isVerified) {
      return next(new Error('Invalid user'));
    }
    
    const tenant = await Tenant.findById(payload.tenantId);
    if (!tenant || !tenant.isActive) {
      return next(new Error('Invalid tenant'));
    }
    
    // Attach user data to socket
    socket.user = user;
    socket.tenant = tenant;
    socket.permissions = payload.permissions;
    
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

/**
 * Generate token pair (access + refresh)
 */
async function generateTokenPair(user: IUser): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const accessTokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user._id.toString(),
    tenantId: user.tenantId.toString(),
    role: user.role,
    permissions: user.permissions,
  };
  
  const refreshTokenPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    userId: user._id.toString(),
    tenantId: user.tenantId.toString(),
  };
  
  const accessToken = jwt.sign(accessTokenPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiry,
  });
  
  const refreshToken = jwt.sign(refreshTokenPayload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry,
  });
  
  // Store refresh token in Redis with expiration
  if (redis.isAvailable()) {
    const refreshExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
    await redis.set(
      `refresh:${user._id}`,
      refreshToken,
      refreshExpiry
    );
  }
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

/**
 * Refresh access token
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  try {
    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret) as RefreshTokenPayload;
    
    // Check if refresh token exists in Redis
    if (redis.isAvailable()) {
      const storedToken = await redis.get(`refresh:${payload.userId}`);
      if (storedToken !== refreshToken) {
        throw new CustomError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }
    }
    
    // Load user
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive || !user.isVerified) {
      throw new CustomError('Invalid user', 401, 'INVALID_USER');
    }
    
    // Generate new access token
    const tokenPair = await generateTokenPair(user);
    
    return {
      accessToken: tokenPair.accessToken,
      expiresIn: tokenPair.expiresIn,
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new CustomError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new CustomError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
    throw error;
  }
}

/**
 * Logout and blacklist token
 */
async function logout(token: string, userId: string): Promise<void> {
  if (redis.isAvailable()) {
    // Blacklist access token
    const decoded = jwt.decode(token) as JWTPayload;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.set(`blacklist:${token}`, 'true', ttl);
    }
    
    // Remove refresh token
    await redis.del(`refresh:${userId}`);
  }
}

export {
  auth,
  optionalAuth,
  authorize,
  requirePermission,
  authenticateSocket,
  generateTokenPair,
  refreshAccessToken,
  logout,
  verifyToken,
};

export default auth;
