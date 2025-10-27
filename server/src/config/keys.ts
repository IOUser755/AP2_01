import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface Config {
  // Environment
  nodeEnv: string;
  port: number;
  host: string;
  
  // Database
  mongoUri: string;
  redisUrl: string;
  
  // JWT
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiry: string;
  jwtRefreshExpiry: string;
  
  // CORS
  corsOrigins: string[];
  
  // Rate limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  
  // File uploads
  maxFileSize: number;
  allowedFileTypes: string[];
  
  // External APIs
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  
  coinbaseApiKey: string;
  coinbaseApiSecret: string;
  coinbaseWebhookSecret: string;
  
  googleCloudProjectId: string;
  googleCloudKeyFile: string;
  
  // Email
  emailProvider: string;
  emailApiKey: string;
  emailFromAddress: string;
  
  // Monitoring
  logLevel: string;
  enableMetrics: boolean;
  metricsPort: number;
  
  // Security
  encryptionKey: string;
  hashSaltRounds: number;
  sessionSecret: string;
  
  // Features
  enableWebsocket: boolean;
  enableBackgroundJobs: boolean;
  enableCaching: boolean;
}

/**
 * Validate required environment variables
 */
function validateRequired(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Parse comma-separated values
 */
function parseArray(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * Parse boolean values
 */
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse integer values
 */
function parseInteger(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  return parsed;
}

const config: Config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInteger(process.env.PORT, 5000),
  host: process.env.HOST || 'localhost',
  
  // Database
  mongoUri: validateRequired('MONGO_URI', process.env.MONGO_URI),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  jwtSecret: validateRequired('JWT_SECRET', process.env.JWT_SECRET),
  jwtRefreshSecret: validateRequired('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET),
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  
  // CORS
  corsOrigins: parseArray(
    process.env.CORS_ORIGINS, 
    ['http://localhost:3000', 'http://localhost:5173'] // Default for Vite dev server
  ),
  
  // Rate limiting
  rateLimitWindowMs: parseInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
  rateLimitMaxRequests: parseInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  
  // File uploads
  maxFileSize: parseInteger(process.env.MAX_FILE_SIZE, 10 * 1024 * 1024), // 10MB
  allowedFileTypes: parseArray(
    process.env.ALLOWED_FILE_TYPES,
    ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  ),
  
  // External APIs
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  coinbaseApiKey: process.env.COINBASE_API_KEY || '',
  coinbaseApiSecret: process.env.COINBASE_API_SECRET || '',
  coinbaseWebhookSecret: process.env.COINBASE_WEBHOOK_SECRET || '',
  
  googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  googleCloudKeyFile: process.env.GOOGLE_CLOUD_KEY_FILE || '',
  
  // Email
  emailProvider: process.env.EMAIL_PROVIDER || 'sendgrid',
  emailApiKey: process.env.EMAIL_API_KEY || '',
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@agentpayhub.com',
  
  // Monitoring
  logLevel: process.env.LOG_LEVEL || 'info',
  enableMetrics: parseBoolean(process.env.ENABLE_METRICS, true),
  metricsPort: parseInteger(process.env.METRICS_PORT, 9090),
  
  // Security
  encryptionKey: validateRequired('ENCRYPTION_KEY', process.env.ENCRYPTION_KEY),
  hashSaltRounds: parseInteger(process.env.HASH_SALT_ROUNDS, 12),
  sessionSecret: validateRequired('SESSION_SECRET', process.env.SESSION_SECRET),
  
  // Features
  enableWebsocket: parseBoolean(process.env.ENABLE_WEBSOCKET, true),
  enableBackgroundJobs: parseBoolean(process.env.ENABLE_BACKGROUND_JOBS, true),
  enableCaching: parseBoolean(process.env.ENABLE_CACHING, true),
};

// Validate configuration in production
if (config.nodeEnv === 'production') {
  const requiredInProduction = [
    'stripeSecretKey',
    'emailApiKey',
    'googleCloudProjectId',
  ];
  
  for (const key of requiredInProduction) {
    if (!(config as any)[key]) {
      throw new Error(`Missing required production environment variable: ${key}`);
    }
  }
}

export default config;
