import { Router } from 'express';
import authRoutes from './auth.js';
import agentRoutes from './agents.js';
import transactionRoutes from './transactions.js';
import mandateRoutes from './mandates.js';
import templateRoutes from './templates.js';
import integrationRoutes from './integrations.js';
import analyticsRoutes from './analytics.js';
import webhookRoutes from './webhooks.js';
import adminRoutes from './admin.js';
import { auth, tenantIsolation, rateLimiter } from '../middleware/index.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

router.use('/auth', rateLimiter.auth, authRoutes);
router.use('/webhooks', rateLimiter.api, webhookRoutes);

router.use('/agents', rateLimiter.api, auth, tenantIsolation, agentRoutes);
router.use('/transactions', rateLimiter.api, auth, tenantIsolation, transactionRoutes);
router.use('/mandates', rateLimiter.api, auth, tenantIsolation, mandateRoutes);
router.use('/templates', rateLimiter.api, auth, tenantIsolation, templateRoutes);
router.use('/integrations', rateLimiter.api, auth, tenantIsolation, integrationRoutes);
router.use('/analytics', rateLimiter.api, auth, tenantIsolation, analyticsRoutes);

router.use('/admin', rateLimiter.expensive, auth, adminRoutes);

router.get('/docs', (_req, res) => {
  res.redirect('/api-docs');
});

export default router;
