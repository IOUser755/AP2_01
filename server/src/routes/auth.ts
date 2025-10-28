import { Router } from 'express';
import { authRateLimit } from '../middleware/rateLimiter.js';
import validation from '../middleware/validation.js';

const router = Router();

router.post('/login', authRateLimit, validation, (_req, res) => {
  res.status(501).json({ message: 'Login not implemented yet' });
});

router.post('/register', authRateLimit, validation, (_req, res) => {
  res.status(501).json({ message: 'Register not implemented yet' });
});

router.post('/refresh', authRateLimit, validation, (_req, res) => {
  res.status(501).json({ message: 'Token refresh not implemented yet' });
});

export default router;
