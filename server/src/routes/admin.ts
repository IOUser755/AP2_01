import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import validation from '../middleware/validation.js';

const router = Router();

router.get('/tenants', requirePermission('admin:read'), validation, (_req, res) => {
  res.status(501).json({ message: 'Admin tenant listing not implemented yet' });
});

export default router;
