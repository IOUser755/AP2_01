import { Router } from 'express';
import validation from '../middleware/validation.js';

const router = Router();

router.get('/', validation, (_req, res) => {
  res.status(501).json({ message: 'Integration list not implemented yet' });
});

export default router;
