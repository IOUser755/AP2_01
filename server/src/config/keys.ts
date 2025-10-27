import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface Config {
  nodeEnv: string;
  port: number;
  host: string;
  clientUrl: string;
  mongoUri: string;
  redisUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiry: string;
  jwtRefreshExpiry: string;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  coinbaseApiKey: string;
  coinbaseApiSecret: string;
  coinbaseWebhookSecret: string;
  googleCloudProjectId: string;
  googleCloudKeyFile: string;
  emailProvider: string;
  emailApiKey: string;
  emailFromAddress: string;
  logLevel: string;
  enableMetrics: boolean;
  metricsPort: number;
  encryptionKey: string;
  hashSaltRounds: number;
  sessionSecret: string;
  enableWebsocket: boolean;
  enableBackgroundJobs: boolean;
  enableCaching: boolean;
}

function validateRequired(key: string, value: string | undefined | null): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function parseArray(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined) return defaultValue;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

function parseInteger(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

const mongoUri = validateRequired(
  'MONGO_URI or MONGODB_URI',
  process.env.MONGO_URI || process.env.MONGODB_URI
);

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInteger(process.env.PORT, 5000),
  host: process.env.HOST || '0.0.0.0',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: validateRequired('JWT_SECRET', process.env.JWT_SECRET),
  jwtRefreshSecret: validateRequired('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET),
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  corsOrigins: parseArray(process.env.CORS_ORIGINS, [
    'http://localhost:3000',
    'http://localhost:5173',
  ]),
  rateLimitWindowMs: parseInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMaxRequests: parseInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  maxFileSize: parseInteger(process.env.MAX_FILE_SIZE, 10 * 1024 * 1024),
  allowedFileTypes: parseArray(process.env.ALLOWED_FILE_TYPES, [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
  ]),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  coinbaseApiKey: process.env.COINBASE_API_KEY || '',
  coinbaseApiSecret: process.env.COINBASE_API_SECRET || '',
  coinbaseWebhookSecret: process.env.COINBASE_WEBHOOK_SECRET || '',
  googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  googleCloudKeyFile: process.env.GOOGLE_CLOUD_KEY_FILE || '',
  emailProvider: process.env.EMAIL_PROVIDER || 'sendgrid',
  emailApiKey: process.env.EMAIL_API_KEY || '',
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@agentpayhub.com',
  logLevel: process.env.LOG_LEVEL || 'info',
  enableMetrics: parseBoolean(process.env.ENABLE_METRICS, true),
  metricsPort: parseInteger(process.env.METRICS_PORT, 9090),
  encryptionKey: validateRequired('ENCRYPTION_KEY', process.env.ENCRYPTION_KEY),
  hashSaltRounds: parseInteger(process.env.HASH_SALT_ROUNDS, 12),
  sessionSecret: validateRequired('SESSION_SECRET', process.env.SESSION_SECRET),
  enableWebsocket: parseBoolean(process.env.ENABLE_WEBSOCKET, true),
  enableBackgroundJobs: parseBoolean(process.env.ENABLE_BACKGROUND_JOBS, true),
  enableCaching: parseBoolean(process.env.ENABLE_CACHING, true),
};

if (config.nodeEnv === 'production') {
  const requiredInProduction: Array<keyof Config> = [
    'stripeSecretKey',
    'emailApiKey',
    'googleCloudProjectId',
  ];

  for (const key of requiredInProduction) {
    if (!config[key]) {
      throw new Error(`Missing required production environment variable: ${String(key)}`);
    }
  }
}

export default config;
