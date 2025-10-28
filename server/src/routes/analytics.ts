import { Router } from 'express';
import validation from '../middleware/validation.js';

const router = Router();

router.get('/overview', validation, (_req, res) => {
  res.status(501).json({ message: 'Analytics overview not implemented yet' });
});

export default router;
