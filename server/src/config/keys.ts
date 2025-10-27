import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  nodeEnv: string;
  port: number;
  clientUrl: string;
  mongodbUri: string;
  mongodbTestUri: string;
  redisUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  sendgridApiKey: string;
  fromEmail: string;
  gcpProjectId: string;
  gcpKeyRing: string;
  gcpKeyName: string;
}

const validateConfig = (): Config => {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'MONGODB_URI',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    mongodbUri: process.env.MONGODB_URI!,
    mongodbTestUri: process.env.MONGODB_TEST_URI || process.env.MONGODB_URI!,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwtSecret: process.env.JWT_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@agentpay.com',
    gcpProjectId: process.env.GCP_PROJECT_ID || '',
    gcpKeyRing: process.env.GCP_KEY_RING || '',
    gcpKeyName: process.env.GCP_KEY_NAME || '',
  };
};

const config = validateConfig();

export default config;
