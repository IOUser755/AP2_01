import cors from 'cors';
import config from '../config/keys.js';
import { logger } from '../config/logger.js';

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    logger.security('Blocked CORS request', { origin });
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-Id', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
});

export default corsMiddleware;
