import { Router } from 'express';
import { validateApiKey } from '../middleware/security.js';

const router = Router();

router.post('/:provider', validateApiKey, (req, res) => {
  res.status(202).json({ message: `Webhook received for ${req.params.provider}` });
});

export default router;
