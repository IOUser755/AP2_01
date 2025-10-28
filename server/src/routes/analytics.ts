import { Router } from 'express';
import { query } from 'express-validator';
import validation from '../middleware/validation.js';
import { getAnalyticsOverview } from '../controllers/analyticsController.js';

const router = Router();

const analyticsValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  query('agentIds').optional().isString(),
  query('statuses').optional().isString(),
  query('currencies').optional().isString(),
  query('reportType').optional().isString(),
];

router.get('/overview', analyticsValidation, validation, getAnalyticsOverview);

export default router;
