import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Joi from 'joi';
import { CustomError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export const handleValidationResult = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    next();
    return;
  }

  const extractedErrors = errors.array().map(err => `${err.param}: ${err.msg}`);

  logger.warn('Validation failed', {
    errors: extractedErrors,
    path: req.path,
    method: req.method,
    userId: (req as any).user?._id,
    tenantId: (req as any).tenant?._id,
  });

  next(new CustomError(`Validation failed: ${extractedErrors.join(', ')}`, 400, 'VALIDATION_ERROR'));
};

interface ValidationOptions {
  abortEarly?: boolean;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
}

export const validateSchema = (
  schema: {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    headers?: Joi.ObjectSchema;
  },
  options: ValidationOptions = {}
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const validationOptions: Joi.ValidationOptions = {
      abortEarly: options.abortEarly ?? false,
      allowUnknown: options.allowUnknown ?? false,
      stripUnknown: options.stripUnknown ?? true,
    };

    const validationErrors: string[] = [];

    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, validationOptions);
      if (error) {
        validationErrors.push(...error.details.map(detail => detail.message));
      } else {
        req.body = value;
      }
    }

    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, validationOptions);
      if (error) {
        validationErrors.push(...error.details.map(detail => detail.message));
      } else {
        req.query = value;
      }
    }

    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, validationOptions);
      if (error) {
        validationErrors.push(...error.details.map(detail => detail.message));
      } else {
        req.params = value;
      }
    }

    if (schema.headers) {
      const { error } = schema.headers.validate(req.headers, validationOptions);
      if (error) {
        validationErrors.push(...error.details.map(detail => detail.message));
      }
    }

    if (validationErrors.length > 0) {
      logger.warn('Schema validation failed', {
        errors: validationErrors,
        path: req.path,
        method: req.method,
        userId: (req as any).user?._id,
        tenantId: (req as any).tenant?._id,
      });

      next(
        new CustomError(
          `Validation failed: ${validationErrors.join(', ')}`,
          400,
          'VALIDATION_ERROR'
        )
      );
      return;
    }

    next();
  };
};

export const commonSchemas = {
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format'),
  email: Joi.string().email().lowercase().trim(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Password must contain at least 8 characters with uppercase, lowercase, number and special character'),
  url: Joi.string().uri(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).message('Invalid phone number format'),
  currency: Joi.string().length(3).uppercase(),
  amount: Joi.number().positive().precision(2),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().default('createdAt'),
  },
  dateRange: {
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
  },
};

export const authSchemas = {
  register: {
    body: Joi.object({
      firstName: Joi.string().trim().min(2).max(50).required(),
      lastName: Joi.string().trim().min(2).max(50).required(),
      email: commonSchemas.email.required(),
      password: commonSchemas.password.required(),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
      }),
      tenantName: Joi.string().trim().min(2).max(100).required(),
      domain: Joi.string().trim().domain().optional(),
    }),
  },
  login: {
    body: Joi.object({
      email: commonSchemas.email.required(),
      password: Joi.string().required(),
      rememberMe: Joi.boolean().default(false),
    }),
  },
  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string().required(),
    }),
  },
  forgotPassword: {
    body: Joi.object({
      email: commonSchemas.email.required(),
    }),
  },
  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      password: commonSchemas.password.required(),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    }),
  },
  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: commonSchemas.password.required(),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
    }),
  },
};

export const agentSchemas = {
  create: {
    body: Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      description: Joi.string().trim().max(500).optional(),
      type: Joi.string()
        .valid('PAYMENT', 'WORKFLOW', 'DATA_PROCESSOR', 'NOTIFICATION', 'CUSTOM')
        .required(),
      templateId: commonSchemas.objectId.optional(),
      configuration: Joi.object({
        workflow: Joi.array()
          .items(
            Joi.object({
              id: Joi.string().required(),
              type: Joi.string().valid('TRIGGER', 'ACTION', 'CONDITION', 'APPROVAL').required(),
              name: Joi.string().required(),
              description: Joi.string().optional(),
              toolType: Joi.string().required(),
              parameters: Joi.object().default({}),
              position: Joi.object({
                x: Joi.number().required(),
                y: Joi.number().required(),
              }).required(),
              connections: Joi.object().default({}),
              errorHandling: Joi.object({
                strategy: Joi.string().valid('STOP', 'CONTINUE', 'RETRY', 'ROLLBACK').default('STOP'),
                maxRetries: Joi.number().min(0).max(10).default(3),
                fallbackStepId: Joi.string().optional(),
              }).default({}),
              timeout: Joi.number().min(1000).max(300000).default(30000),
            })
          )
          .min(1)
          .required(),
        tools: Joi.array()
          .items(
            Joi.object({
              type: Joi.string().required(),
              name: Joi.string().required(),
              config: Joi.object().default({}),
              enabled: Joi.boolean().default(true),
            })
          )
          .default([]),
        triggers: Joi.array()
          .items(
            Joi.object({
              type: Joi.string().valid('WEBHOOK', 'SCHEDULE', 'MANUAL', 'EVENT').required(),
              config: Joi.object().required(),
              enabled: Joi.boolean().default(true),
            })
          )
          .default([]),
        variables: Joi.object().default({}),
        constraints: Joi.object({
          budgetLimit: Joi.object({
            amount: Joi.number().min(0).required(),
            currency: commonSchemas.currency.required(),
            period: Joi.string().valid('TRANSACTION', 'DAILY', 'WEEKLY', 'MONTHLY').default('MONTHLY'),
          }).optional(),
          timeLimit: Joi.object({
            maxExecutionTime: Joi.number().min(1).max(1440).default(60),
            timeZone: Joi.string().default('UTC'),
          }).optional(),
          approvalRequired: Joi.boolean().default(false),
          geoRestrictions: Joi.array().items(Joi.string().length(2).uppercase()).optional(),
        }).default({}),
        notifications: Joi.object({
          onStart: Joi.boolean().default(false),
          onComplete: Joi.boolean().default(true),
          onError: Joi.boolean().default(true),
          onApprovalNeeded: Joi.boolean().default(true),
          channels: Joi.array()
            .items(
              Joi.object({
                type: Joi.string().valid('EMAIL', 'WEBHOOK', 'SLACK', 'SMS').required(),
                config: Joi.object().required(),
              })
            )
            .default([]),
        }).required(),
      }).required(),
      metadata: Joi.object({
        tags: Joi.array().items(Joi.string().trim().lowercase()).default([]),
        category: Joi.string().trim().default('general'),
        priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').default('MEDIUM'),
        environment: Joi.string().valid('SANDBOX', 'PRODUCTION').default('SANDBOX'),
      }).default({}),
    }),
  },
  update: {
    params: {
      id: commonSchemas.objectId.required(),
    },
    body: Joi.object({
      name: Joi.string().trim().min(2).max(100).optional(),
      description: Joi.string().trim().max(500).optional(),
      status: Joi.string().valid('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED').optional(),
      configuration: Joi.object().optional(),
      metadata: Joi.object().optional(),
    }),
  },
  execute: {
    params: {
      id: commonSchemas.objectId.required(),
    },
    body: Joi.object({
      context: Joi.object().default({}),
      variables: Joi.object().default({}),
    }),
  },
  list: {
    query: Joi.object({
      ...commonSchemas.pagination,
      status: Joi.string().valid('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED').optional(),
      type: Joi.string().valid('PAYMENT', 'WORKFLOW', 'DATA_PROCESSOR', 'NOTIFICATION', 'CUSTOM').optional(),
      category: Joi.string().optional(),
      search: Joi.string().trim().optional(),
      tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    }),
  },
};

export default handleValidationResult;
