import { createClient, RedisClientType } from 'redis';
import config from './keys.js';
import logger from './logger.js';

interface RedisHealth {
  status: 'healthy' | 'unhealthy';
  details: Record<string, any>;
}

class RedisManager {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxRetryAttempts = 5;

  /**
   * Connect to Redis with retry logic
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      logger.info('Redis already connected');
      return;
    }

    try {
      this.connectionAttempts++;

      logger.info('Connecting to Redis...', {
        url: this.sanitizeUrl(config.redisUrl),
        attempt: this.connectionAttempts,
        maxAttempts: this.maxRetryAttempts,
      });

      this.client = createClient({
        url: config.redisUrl,
        database: 0,
        socket: {
          connectTimeout: 30000,
          lazyConnect: true,
          reconnectStrategy: retries => {
            if (retries > 10) {
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
        commandQueueMaxLength: 1000,
      });

      this.setupEventListeners();

      await this.client.connect();

      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('Redis connected successfully');
    } catch (error: any) {
      logger.error('Redis connection failed', {
        error: error.message,
        attempt: this.connectionAttempts,
        maxAttempts: this.maxRetryAttempts,
      });

      if (this.connectionAttempts < this.maxRetryAttempts) {
        const delay = Math.min(this.connectionAttempts * 1000, 5000);
        logger.info(`Retrying Redis connection in ${delay}ms...`);
        await this.delay(delay);
        return this.connect();
      }

      logger.error('Max Redis connection attempts reached. Continuing without Redis...');
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      logger.info('Redis client not initialized');
      return;
    }

    try {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected successfully');
    } catch (error: any) {
      logger.error('Error disconnecting from Redis', { error: error.message });
    }
  }

  /**
   * Get Redis client
   */
  getClient(): RedisClientType | null {
    if (!this.isConnected || !this.client) {
      logger.warn('Redis client not available');
      return null;
    }
    return this.client;
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<RedisHealth> {
    if (!this.client || !this.isConnected) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: 'Redis client not available',
        },
      };
    }

    try {
      const startTime = Date.now();
      const pong = await this.client.ping();
      const responseTime = Date.now() - startTime;
      const info = await this.client.info();
      const memory = await this.client.info('memory');

      return {
        status: 'healthy',
        details: {
          connected: this.isConnected,
          ping: pong,
          responseTime: `${responseTime}ms`,
          version: this.extractInfo(info, 'redis_version'),
          uptime: this.extractInfo(info, 'uptime_in_seconds'),
          connectedClients: this.extractInfo(info, 'connected_clients'),
          usedMemory: this.extractInfo(memory, 'used_memory_human'),
          totalSystemMemory: this.extractInfo(memory, 'total_system_memory_human'),
        },
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: {
          connected: this.isConnected,
          error: error.message,
        },
      };
    }
  }

  /**
   * Cache operations
   */
  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      return await this.client!.get(key);
    } catch (error: any) {
      logger.error('Redis GET error', { key, error: error.message });
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      if (ttl) {
        await this.client!.setEx(key, ttl, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error: any) {
      logger.error('Redis SET error', { key, error: error.message });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.client!.del(key);
      return true;
    } catch (error: any) {
      logger.error('Redis DEL error', { key, error: error.message });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error: any) {
      logger.error('Redis EXISTS error', { key, error: error.message });
      return false;
    }
  }

  /**
   * JSON operations
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error: any) {
      logger.error('Redis JSON parse error', { key, error: error.message });
      return null;
    }
  }

  async setJSON<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, ttl);
    } catch (error: any) {
      logger.error('Redis JSON stringify error', { key, error: error.message });
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', error => {
      logger.error('Redis client error', { error: error.message });
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection ended');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
      this.isConnected = false;
    });
  }

  private extractInfo(info: string, key: string): string {
    const lines = info.split('\r\n');
    const line = lines.find(l => l.startsWith(`${key}:`));
    return line ? line.split(':')[1] : 'unknown';
  }

  private sanitizeUrl(url: string): string {
    return url.replace(/:([^@]+)@/, ':***@');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const redis = new RedisManager();

export default redis;
