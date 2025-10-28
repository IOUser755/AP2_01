import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import compression from 'compression';
import config from './config/keys.js';
import { logger } from './config/logger.js';
import database from './config/database.js';
import redis from './config/redis.js';
import corsConfig from './middleware/cors.js';
import { securityHeaders, requestSecurity, apiRateLimit, requestSlowDown } from './middleware/security.js';
import requestLogger from './middleware/requestLogger.js';
import errorHandler, { notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

class Server {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer | null = null;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);

    void this.init();
  }

  private async init(): Promise<void> {
    try {
      await this.connectDatabases();
      this.setupMiddleware();
      this.setupRoutes();

      if (config.enableWebsocket) {
        this.setupWebSocket();
      }

      this.setupErrorHandling();
      this.start();
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to initialize server', err);
      process.exit(1);
    }
  }

  private async connectDatabases(): Promise<void> {
    logger.info('Connecting to databases...');

    await database.connect();

    if (config.enableCaching) {
      await redis.connect();
    }

    logger.info('Database connections established');
  }

  private setupMiddleware(): void {
    logger.info('Setting up middleware...');

    this.app.set('trust proxy', 1);

    this.app.use(securityHeaders);
    this.app.use(requestSecurity);
    this.app.use(apiRateLimit);
    this.app.use(requestSlowDown);
    this.app.use(corsConfig);
    this.app.use(requestLogger);

    this.app.use(express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use(compression());

    logger.info('Middleware setup complete');
  }

  private setupRoutes(): void {
    logger.info('Setting up routes...');

    this.app.get('/health', async (_req, res) => {
      try {
        const dbHealth = await database.healthCheck();
        const redisHealth = config.enableCaching
          ? await redis.healthCheck()
          : { status: 'disabled', details: { message: 'Caching disabled' } };

        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0',
          environment: config.nodeEnv,
          services: {
            database: dbHealth,
            redis: redisHealth,
          },
        });
      } catch (error: any) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Health check failed', err);
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error?.message ?? 'Unknown error',
        });
      }
    });

    this.app.use('/api', apiRoutes);

    logger.info('Routes setup complete');
  }

  private setupWebSocket(): void {
    logger.info('Setting up WebSocket server...');

    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', socket => {
      logger.info('WebSocket client connected', { socketId: socket.id });

      socket.on('authenticate', token => {
        logger.info('WebSocket authentication attempt', { socketId: socket.id, token: Boolean(token) });
      });

      socket.on('disconnect', reason => {
        logger.info('WebSocket client disconnected', {
          socketId: socket.id,
          reason,
        });
      });
    });

    logger.info('WebSocket server setup complete');
  }

  private setupErrorHandling(): void {
    logger.info('Setting up error handling...');

    this.app.use(notFoundHandler);
    this.app.use(errorHandler);

    process.on('uncaughtException', error => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Uncaught Exception', err);
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', reason => {
      const err = reason instanceof Error ? reason : new Error(String(reason));
      logger.error('Unhandled Rejection', err);
      this.gracefulShutdown('UNHANDLED_REJECTION');
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      this.gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received');
      this.gracefulShutdown('SIGINT');
    });

    logger.info('Error handling setup complete');
  }

  private start(): void {
    this.server.listen(config.port, config.host, () => {
      logger.info('Server started successfully', {
        host: config.host,
        port: config.port,
        environment: config.nodeEnv,
        websocket: config.enableWebsocket,
        caching: config.enableCaching,
      });
    });
  }

  private gracefulShutdown(signal: string): void {
    logger.info(`Graceful shutdown initiated: ${signal}`);

    this.server.close(async () => {
      logger.info('HTTP server closed');

      try {
        if (this.io) {
          this.io.close();
          logger.info('WebSocket server closed');
        }

        await database.disconnect();
        await redis.disconnect();

        logger.info('All connections closed. Exiting...');
        process.exit(0);
      } catch (error: any) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error during graceful shutdown', err);
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('Forced shutdown after 30 seconds');
      process.exit(1);
    }, 30000).unref();
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getIO(): SocketIOServer | null {
    return this.io;
  }
}

const server = new Server();

export default server;
