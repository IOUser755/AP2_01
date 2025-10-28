import { Router } from 'express';
import { executionRateLimit } from '../middleware/rateLimiter.js';
import validation from '../middleware/validation.js';

const router = Router();

router.get('/', validation, (_req, res) => {
  res.status(501).json({ message: 'List agents not implemented yet' });
});

router.post('/', executionRateLimit, validation, (_req, res) => {
  res.status(501).json({ message: 'Create agent not implemented yet' });
});

export default router;
