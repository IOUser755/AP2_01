import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { CustomError } from './errorHandler.js';
import { logger } from '../config/logger.js';

/**
 * Tenant isolation middleware
 * Ensures all database queries are scoped to the authenticated user's tenant
 */
const tenantIsolation = (req: Request, res: Response, next: NextFunction): void => {
  // Skip if no user (public endpoints)
  if (!req.user || !req.tenant) {
    return next();
  }

  const tenantId = req.tenant._id;
  
  // Store original mongoose methods
  const originalFind = mongoose.Model.find;
  const originalFindOne = mongoose.Model.findOne;
  const originalFindOneAndUpdate = mongoose.Model.findOneAndUpdate;
  const originalUpdateOne = mongoose.Model.updateOne;
  const originalUpdateMany = mongoose.Model.updateMany;
  const originalDeleteOne = mongoose.Model.deleteOne;
  const originalDeleteMany = mongoose.Model.deleteMany;
  const originalAggregate = mongoose.Model.aggregate;

  /**
   * Helper function to add tenant filter to query
   */
  const addTenantFilter = (query: any): any => {
    if (!query) query = {};
    
    // Skip if tenantId already specified or if it's a Tenant model query
    if (query.tenantId !== undefined) {
      return query;
    }
    
    // Add tenantId filter
    return { ...query, tenantId };
  };

  /**
   * Override find method
   */
  mongoose.Model.find = function(query?: any, projection?: any, options?: any) {
    // Skip tenant isolation for Tenant and User models in specific cases
    if (this.modelName === 'Tenant' || 
        (this.modelName === 'User' && req.path.includes('/auth'))) {
      return originalFind.call(this, query, projection, options);
    }

    const filteredQuery = addTenantFilter(query);
    return originalFind.call(this, filteredQuery, projection, options);
  };

  /**
   * Override findOne method
   */
  mongoose.Model.findOne = function(query?: any, projection?: any, options?: any) {
    if (this.modelName === 'Tenant' || 
        (this.modelName === 'User' && req.path.includes('/auth'))) {
      return originalFindOne.call(this, query, projection, options);
    }

    const filteredQuery = addTenantFilter(query);
    return originalFindOne.call(this, filteredQuery, projection, options);
  };

  /**
   * Override findOneAndUpdate method
   */
  mongoose.Model.findOneAndUpdate = function(
    query?: any, 
    update?: any, 
    options?: any
  ) {
    if (this.modelName === 'Tenant' || 
        (this.modelName === 'User' && req.path.includes('/auth'))) {
      return originalFindOneAndUpdate.call(this, query, update, options);
    }

    const filteredQuery = addTenantFilter(query);
    return originalFindOneAndUpdate.call(this, filteredQuery, update, options);
  };

  /**
   * Override updateOne method
   */
  mongoose.Model.updateOne = function(query?: any, update?: any, options?: any) {
    if (this.modelName === 'Tenant' || 
        (this.modelName === 'User' && req.path.includes('/auth'))) {
      return originalUpdateOne.call(this, query, update, options);
    }

    const filteredQuery = addTenantFilter(query);
    return originalUpdateOne.call(this, filteredQuery, update, options);
  };

  /**
   * Override updateMany method
   */
  mongoose.Model.updateMany = function(query?: any, update?: any, options?: any) {
    if (this.modelName === 'Tenant' || 
        (this.modelName === 'User' && req.path.includes('/auth'))) {
      return originalUpdateMany.call(this, query, update, options);
    }

    const filteredQuery = addTenantFilter(query);
    return originalUpdateMany.call(this, filteredQuery, update, options);
  };

  /**
   * Override deleteOne method
   */
  mongoose.Model.deleteOne = function(query?: any, options?: any) {
    if (this.modelName === 'Tenant' || 
        (this.modelName === 'User' && req.path.includes('/auth'))) {
      return originalDeleteOne.call(this, query, options);
    }

    const filteredQuery = addTenantFilter(query);
    return originalDeleteOne.call(this, filteredQuery, options);
  };

  /**
   * Override deleteMany method
   */
  mongoose.Model.deleteMany = function(query?: any, options?: any) {
    if (this.modelName === 'Tenant' || 
        (this.modelName === 'User' && req.path.includes('/auth'))) {
      return originalDeleteMany.call(this, query, options);
    }

    const filteredQuery = addTenantFilter(query);
    return originalDeleteMany.call(this, filteredQuery, options);
  };

  /**
   * Override aggregate method
   */
  mongoose.Model.aggregate = function(pipeline?: any[], options?: any) {
    if (this.modelName === 'Tenant' || 
        (this.modelName === 'User' && req.path.includes('/auth'))) {
      return originalAggregate.call(this, pipeline, options);
    }

    // Add tenant filter as first stage in pipeline
    const tenantMatch = { $match: { tenantId } };
    const modifiedPipeline = pipeline ? [tenantMatch, ...pipeline] : [tenantMatch];
    
    return originalAggregate.call(this, modifiedPipeline, options);
  };

  // Restore original methods after request
  res.on('finish', () => {
    mongoose.Model.find = originalFind;
    mongoose.Model.findOne = originalFindOne;
    mongoose.Model.findOneAndUpdate = originalFindOneAndUpdate;
    mongoose.Model.updateOne = originalUpdateOne;
    mongoose.Model.updateMany = originalUpdateMany;
    mongoose.Model.deleteOne = originalDeleteOne;
    mongoose.Model.deleteMany = originalDeleteMany;
    mongoose.Model.aggregate = originalAggregate;
  });

  // Log tenant isolation
  logger.debug('Tenant isolation applied', {
    tenantId: tenantId.toString(),
    userId: req.user._id.toString(),
    path: req.path,
    method: req.method,
  });

  next();
};

/**
 * Middleware to ensure resource ownership
 * Validates that the requested resource belongs to the authenticated tenant
 */
const validateResourceOwnership = (
  resourceModel: string,
  resourceIdParam: string = 'id'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.tenant) {
      return next(new CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    const resourceId = req.params[resourceIdParam];
    if (!resourceId) {
      return next(new CustomError('Resource ID required', 400, 'RESOURCE_ID_REQUIRED'));
    }

    try {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return next(new CustomError('Invalid resource ID format', 400, 'INVALID_RESOURCE_ID'));
      }

      // Get the model
      const Model = mongoose.model(resourceModel);
      
      // Find resource with tenant isolation
      const resource = await Model.findOne({
        _id: resourceId,
        tenantId: req.tenant._id,
      });

      if (!resource) {
        return next(new CustomError(
          `${resourceModel} not found or access denied`, 
          404, 
          'RESOURCE_NOT_FOUND'
        ));
      }

      // Attach resource to request for use in controller
      (req as any).resource = resource;

      next();
    } catch (error) {
      logger.error('Resource ownership validation failed', {
        error: (error as Error).message,
        resourceModel,
        resourceId,
        tenantId: req.tenant._id.toString(),
        userId: req.user._id.toString(),
      });

      next(error);
    }
  };
};

/**
 * Middleware to validate tenant-scoped bulk operations
 */
const validateBulkOperation = (maxItems: number = 100) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.tenant) {
      return next(new CustomError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return next(new CustomError('IDs array required for bulk operation', 400, 'IDS_REQUIRED'));
    }

    if (ids.length === 0) {
      return next(new CustomError('At least one ID required', 400, 'EMPTY_IDS_ARRAY'));
    }

    if (ids.length > maxItems) {
      return next(new CustomError(
        `Bulk operation limited to ${maxItems} items`, 
        400, 
        'BULK_LIMIT_EXCEEDED'
      ));
    }

    // Validate all IDs are valid ObjectIds
    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return next(new CustomError(
        `Invalid ID format: ${invalidIds.join(', ')}`, 
        400, 
        'INVALID_ID_FORMAT'
      ));
    }

    logger.info('Bulk operation validated', {
      tenantId: req.tenant._id.toString(),
      userId: req.user._id.toString(),
      itemCount: ids.length,
      operation: req.method,
      path: req.path,
    });

    next();
  };
};

export {
  tenantIsolation,
  validateResourceOwnership,
  validateBulkOperation,
};

export default tenantIsolation;
