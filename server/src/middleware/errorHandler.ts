import { Request, Response, NextFunction } from 'express';
import { MongoError } from 'mongodb';
import { logger } from '../config/logger.js';
import config from '../config/keys.js';

import { AppError, CustomError } from '../utils/errors.js';
=======

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string | number;
  errors?: any[];
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  errors?: any[];

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}


interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
    stack?: string;
  };
  requestId?: string;
  timestamp: string;
}

function handleMongoError(error: MongoError): CustomError {
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyPattern || {})[0] || 'field';
    return new CustomError(`Duplicate value for ${field}`, 400, 'DUPLICATE_VALUE');
  }

  if ((error as any).name === 'ValidationError') {
    const errors = Object.values((error as any).errors).map((val: any) => val.message);
    return new CustomError(`Validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  if ((error as any).name === 'CastError') {
    return new CustomError('Invalid data format', 400, 'INVALID_FORMAT');
  }

  return new CustomError('Database error', 500, 'DATABASE_ERROR');
}

function handleJWTError(error: Error): CustomError {
  if (error.name === 'JsonWebTokenError') {
    return new CustomError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (error.name === 'TokenExpiredError') {
    return new CustomError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  return new CustomError('Authentication failed', 401, 'AUTH_FAILED');
}

function handleValidationError(error: any): CustomError {
  if (error.name === 'ValidationError' && error.details) {
    const messages = error.details.map((detail: any) => detail.message);
    return new CustomError(`Validation failed: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
  }

  return new CustomError('Validation failed', 400, 'VALIDATION_ERROR');
}

function getStatusCode(error: AppError): number {
  if (error.statusCode) return error.statusCode;
  if (error.name === 'CastError') return 400;
  if (error.name === 'ValidationError') return 400;
  if ((error as any).code === 11000) return 400;
  return 500;
}

function createErrorResponse(
  error: AppError,
  requestId?: string,
  includeStack = false
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code?.toString(),
      details: undefined,
    },
    requestId,
    timestamp: new Date().toISOString(),
  };

  if ((error as any).errors) {
    response.error.details = { errors: (error as any).errors };
  }

  if (config.nodeEnv === 'development') {
    response.error.details = response.error.details ?? error;
    if (includeStack && error.stack) {
      response.error.stack = error.stack;
    }
  }

  return response;
}

function logError(error: AppError, req: Request): void {
  const context = {
    requestId: req.headers['x-request-id'] as string,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
    tenantId: (req as any).user?.tenantId,
    statusCode: getStatusCode(error),
    isOperational: error.isOperational,
  };

  if (error.isOperational) {
    logger.warn(`Operational error: ${error.message}`, context);
  } else {
    logger.error(`System error: ${error.message}`, { ...context, error });
  }
}

const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let handledError = error;

  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    handledError = handleMongoError(error as MongoError);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    handledError = handleJWTError(error);
  } else if (error.name === 'ValidationError') {
    handledError = handleValidationError(error);
  } else if (!error.isOperational) {
    handledError = new CustomError(
      config.nodeEnv === 'production' ? 'Internal server error' : error.message,
      getStatusCode(error),
      'INTERNAL_ERROR'
    );
  }

  logError(handledError, req);

  if (res.headersSent) {
    next(handledError);
    return;
  }

  const statusCode = getStatusCode(handledError);
  const errorResponse = createErrorResponse(
    handledError,
    req.headers['x-request-id'] as string,
    config.nodeEnv === 'development'
  );

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  const errorResponse = createErrorResponse(error, req.headers['x-request-id'] as string);
  res.status(404).json(errorResponse);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
