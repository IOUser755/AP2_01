import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import agentRoutes from '../../routes/agents.js';

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const auth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const token = header.replace('Bearer ', '');
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret') as any;
      (req as any).user = { id: payload.sub, tenantId: payload.tenantId };
      next();
    } catch {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };

  const tenantIsolation = (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => {
    (req as any).tenantId = (req as any).user?.tenantId;
    next();
  };

  const noop = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();

  app.use('/api/agents', noop, auth, tenantIsolation, agentRoutes);
  return app;
};

describe('Agent routes', () => {
  const app = createTestApp();
  const token = jwt.sign(
    { sub: 'user-1', tenantId: 'tenant-1' },
    process.env.JWT_SECRET || 'test-jwt-secret'
  );

  it('rejects unauthenticated access', async () => {
    await request(app).post('/api/agents').send({}).expect(401);
  });

  it('returns not implemented for agent creation', async () => {
    const response = await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Agent' })
      .expect(501);

    expect(response.body).toHaveProperty('message');
  });

  it('returns not implemented for agent listing', async () => {
    const response = await request(app)
      .get('/api/agents')
      .set('Authorization', `Bearer ${token}`)
      .expect(501);

    expect(response.body).toHaveProperty('message');
  });
});
