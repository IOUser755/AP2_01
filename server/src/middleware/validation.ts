import { Request, Response, NextFunction } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { CustomError } from './errorHandler.js';

const validation = (chains: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(chains.map(chain => chain.run(req)));

    const result = validationResult(req);
    if (result.isEmpty()) {
      next();
      return;
    }

    const errors = result.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));

    const validationError = new CustomError('Validation failed', 400, 'VALIDATION_ERROR');
    (validationError as any).errors = errors;

    (req as any).validationErrors = errors;
    next(validationError);
  };
};

declare global {
  namespace Express {
    interface Request {
      validationErrors?: Array<{ field: string; message: string; value: unknown }>;
    }
  }
}

export default validation;
