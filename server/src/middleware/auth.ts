import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config/keys.js';
import { CustomError } from './errorHandler.js';

interface AuthPayload extends JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        role: string;
        permissions: string[];
        token: string;
      };
    }
  }
}

const auth = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization || req.headers.Authorization;

  if (!header || typeof header !== 'string') {
    throw new CustomError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const token = header.startsWith('Bearer ') ? header.substring(7) : header;

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;

    if (!decoded.userId || !decoded.tenantId) {
      throw new CustomError('Invalid authentication token', 401, 'INVALID_TOKEN');
    }

    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
      permissions: decoded.permissions ?? [],
      token,
    };

    next();
  } catch (error: any) {
    if (error instanceof CustomError) {
      throw error;
    }

    throw new CustomError(error.message || 'Authentication failed', 401, 'AUTH_FAILED');
  }
};

export default auth;
