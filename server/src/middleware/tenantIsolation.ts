import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler.js';

const tenantIsolation = (req: Request, _res: Response, next: NextFunction): void => {
  const headerTenantId = (req.headers['x-tenant-id'] || req.headers['tenant-id']) as string | undefined;
  const userTenantId = req.user?.tenantId;

  if (!headerTenantId && !userTenantId) {
    throw new CustomError('Tenant context is required', 400, 'TENANT_REQUIRED');
  }

  if (headerTenantId && userTenantId && headerTenantId !== userTenantId) {
    throw new CustomError('Tenant mismatch detected', 403, 'TENANT_MISMATCH');
  }

  if (!req.user && headerTenantId) {
    req.user = {
      id: 'anonymous',
      tenantId: headerTenantId,
      role: 'VIEWER',
      permissions: [],
      token: '',
    };
  }

  req.tenantId = req.user?.tenantId || headerTenantId;

  next();
};

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export default tenantIsolation;
