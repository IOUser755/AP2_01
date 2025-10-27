import mongoose from 'mongoose';
import config from './keys.js';
import logger from './logger.js';

interface ConnectionOptions {
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

class DatabaseManager {
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxRetryAttempts = 5;
  private listenersRegistered = false;

  /**
   * Connect to MongoDB with retry logic
   */
  async connect(options: ConnectionOptions = {}): Promise<void> {
    const {
      retryAttempts = this.maxRetryAttempts,
      retryDelay = 5000,
      timeout = 30000,
    } = options;

    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      this.connectionAttempts++;

      logger.info('Connecting to MongoDB...', {
        uri: this.sanitizeUri(config.mongoUri),
        attempt: this.connectionAttempts,
        maxAttempts: retryAttempts,
      });

      const mongooseOptions: mongoose.ConnectOptions = {
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: timeout,
        socketTimeoutMS: 45000,
        readPreference: 'primary',
        retryWrites: true,
        retryReads: true,
        authSource: 'admin',
        compressors: ['zlib'],
        heartbeatFrequencyMS: 10000,
        w: 'majority',
        wtimeoutMS: 5000,
      };

      await mongoose.connect(config.mongoUri, mongooseOptions);

      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('MongoDB connected successfully', {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
      });

      if (!this.listenersRegistered) {
        this.setupEventListeners();
        this.listenersRegistered = true;
      }
    } catch (error: any) {
      logger.error('MongoDB connection failed', {
        error: error.message,
        attempt: this.connectionAttempts,
        maxAttempts: retryAttempts,
      });

      if (this.connectionAttempts < retryAttempts) {
        logger.info(`Retrying connection in ${retryDelay}ms...`);
        await this.delay(retryDelay);
        return this.connect({ retryAttempts, retryDelay, timeout });
      }

      logger.error('Max connection attempts reached. Exiting...');
      throw new Error(`Failed to connect to MongoDB after ${retryAttempts} attempts`);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.info('Database not connected');
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB disconnected successfully');
    } catch (error: any) {
      logger.error('Error disconnecting from MongoDB', { error: error.message });
      throw error;
    }
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    if (!mongoose.connection.db) {
      return {
        status: 'unhealthy',
        details: {
          connected: this.isConnected,
          error: 'Database not initialized',
        },
      };
    }

    try {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;
      const stats = await mongoose.connection.db.stats();

      return {
        status: 'healthy',
        details: {
          connected: this.isConnected,
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          database: mongoose.connection.name,
          responseTime: `${responseTime}ms`,
          collections: stats.collections,
          documents: stats.objects,
          dataSize: `${Math.round(stats.dataSize / 1024 / 1024)}MB`,
          indexSize: `${Math.round(stats.indexSize / 1024 / 1024)}MB`,
        },
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: {
          connected: this.isConnected,
          error: error.message,
          readyState: mongoose.connection.readyState,
        },
      };
    }
  }

  /**
   * Get connection status
   */
  getStatus(): {
    isConnected: boolean;
    readyState: number;
    host?: string;
    port?: number;
    name?: string;
  } {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }

  /**
   * Setup event listeners for connection monitoring
   */
  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', error => {
      logger.error('Mongoose connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, closing MongoDB connection...');
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, closing MongoDB connection...');
      await this.disconnect();
      process.exit(0);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private sanitizeUri(uri: string): string {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  }
}

const database = new DatabaseManager();

export default database;
