import morgan from 'morgan';
import { logger } from '../config/logger.js';
import config from '../config/keys.js';

const requestLogger = morgan((tokens, req, res) => {
  const status = Number(tokens.status(req, res));
  const responseTime = Number(tokens['response-time'](req, res));
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const contentLength = tokens.res(req, res, 'content-length') || '0';
  const requestId = req.headers['x-request-id'] as string | undefined;

  logger.api(method ?? '', url ?? '', status, responseTime, {
    requestId,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength,
  });

  return '';
}, {
  skip: () => config.nodeEnv === 'test',
  stream: {
    write: () => {
      // Output handled by Winston logger above
    },
  },
});

export default requestLogger;
