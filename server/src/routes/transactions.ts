import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  cancelTransaction,
  refundTransaction,
  getTransactionAnalytics,
  exportTransactions,
} from '../controllers/transactionController.js';
import { executionRateLimit, expensiveRateLimit } from '../middleware/rateLimiter.js';
import validation from '../middleware/validation.js';

const router = Router();

const createTransactionValidation = [
  body('agentId').optional().isMongoId().withMessage('Valid agent ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('paymentProvider')
    .isIn(['STRIPE', 'COINBASE', 'CRYPTO', 'BANK'])
    .withMessage('Invalid payment provider'),
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required'),
  body('description').isString().isLength({ max: 500 }).withMessage('Description is required'),
  body('metadata').optional().isObject(),
];

const updateTransactionValidation = [
  param('id').isMongoId().withMessage('Valid transaction ID is required'),
  body('status')
    .optional()
    .isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'DISPUTED'])
    .withMessage('Invalid status'),
  body('metadata').optional().isObject(),
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isIn(['asc', 'desc']).withMessage('Sort must be asc or desc'),
  query('sortBy').optional().isIn(['createdAt', 'amount', 'status']),
  query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'DISPUTED']),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date'),
  query('agentId').optional().isMongoId().withMessage('Agent ID must be valid'),
  query('minAmount').optional().isFloat({ min: 0 }).withMessage('Minimum amount must be non-negative'),
  query('maxAmount').optional().isFloat({ min: 0 }).withMessage('Maximum amount must be non-negative'),
];

router.post('/', executionRateLimit, createTransactionValidation, validation, createTransaction);

router.get('/', queryValidation, validation, getTransactions);

router.get('/analytics', queryValidation, validation, getTransactionAnalytics);

router.get('/export', expensiveRateLimit, queryValidation, validation, exportTransactions);

router.get('/:id', param('id').isMongoId().withMessage('Valid transaction ID is required'), validation, getTransaction);

router.patch('/:id', updateTransactionValidation, validation, updateTransaction);

router.post('/:id/cancel', param('id').isMongoId().withMessage('Valid transaction ID is required'), validation, cancelTransaction);

router.post(
  '/:id/refund',
  param('id').isMongoId().withMessage('Valid transaction ID is required'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be positive'),
  body('reason').optional().isString().isLength({ max: 500 }),
  validation,
  refundTransaction
);

export default router;
