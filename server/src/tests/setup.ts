import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';
process.env.ENABLE_WEBSOCKET = 'false';
process.env.ENABLE_BACKGROUND_JOBS = 'false';
process.env.ENABLE_CACHING = 'false';

jest.mock('ioredis', () => {
  const actual = jest.requireActual('ioredis-mock');
  return { __esModule: true, default: actual, ...actual };
});

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, {
    dbName: 'agentpay-test',
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

export const createTestTenant = async () => {
  const { Tenant } = await import('../models/Tenant.js');
  const suffix = Math.random().toString(36).slice(2, 8);

  return Tenant.create({
    name: `Test Tenant ${suffix}`,
    domain: `tenant-${suffix}.example.com`,
    subdomain: `tenant-${suffix}`,
    companyName: 'Test Tenant Company',
    companyEmail: `contact-${suffix}@example.com`,
    subscription: {
      plan: 'STARTER',
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      amount: 99,
      currency: 'USD',
    },
    features: {
      maxAgents: 10,
      maxTransactionsPerMonth: 5000,
      maxUsers: 25,
      maxTemplates: 5,
      enableMarketplace: true,
      enableAdvancedAnalytics: true,
      enableWhiteLabel: false,
      enablePrioritySupport: false,
      enableCustomDomain: false,
    },
    usage: {
      agentsCreated: 0,
      transactionsThisMonth: 0,
      usersCreated: 1,
      templatesPublished: 0,
      lastResetDate: new Date(),
    },
    compliance: {
      kycVerified: true,
      kycVerifiedAt: new Date(),
      pciCompliant: true,
      pciComplianceDate: new Date(),
    },
    settings: {
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      allowUserSignup: true,
      requireEmailVerification: false,
      twoFactorRequired: false,
    },
    status: 'ACTIVE',
    isDeleted: false,
  });
};

export const createTestUser = async (tenantId: mongoose.Types.ObjectId) => {
  const { User } = await import('../models/User.js');

  return User.create({
    tenantId,
    email: `developer-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'DEVELOPER',
    permissions: ['agents:create', 'agents:read'],
    isVerified: true,
    isActive: true,
  });
};

export const createTestAgent = async (
  tenantId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  overrides: Partial<Record<string, any>> = {}
) => {
  const { Agent } = await import('../models/Agent.js');

  const workflowTriggerId = `trigger-${Date.now()}`;
  const workflowActionId = `action-${Date.now()}`;

  return Agent.create({
    tenantId,
    createdBy: userId,
    lastModifiedBy: userId,
    name: overrides.name || 'Test Payment Agent',
    description: 'Test agent for automated payments',
    type: 'PAYMENT',
    status: 'ACTIVE',
    version: '1.0.0',
    configuration: {
      workflow: [
        {
          id: workflowTriggerId,
          type: 'TRIGGER',
          name: 'Manual Trigger',
          toolType: 'manual_trigger',
          parameters: {},
          position: { x: 0, y: 0 },
          connections: { success: workflowActionId },
          errorHandling: { strategy: 'CONTINUE', maxRetries: 0 },
          timeout: 5000,
        },
        {
          id: workflowActionId,
          type: 'ACTION',
          name: 'Stripe Payment',
          toolType: 'test_tool',
          parameters: {
            amount: '${amount}',
            currency: '${currency}',
            description: 'Payment for ${customer}',
          },
          position: { x: 0, y: 100 },
          connections: {},
          errorHandling: { strategy: 'STOP', maxRetries: 0 },
          timeout: 5000,
        },
      ],
      tools: [
        {
          type: 'PAYMENT',
          name: 'Stripe',
          config: { apiKey: 'sk_test' },
          enabled: true,
        },
      ],
      triggers: [
        {
          type: 'MANUAL',
          config: {},
          enabled: true,
        },
      ],
      variables: {
        amount: 100,
        currency: 'USD',
        customer: 'Test Customer',
      },
      constraints: {
        approvalRequired: false,
      },
      notifications: {
        onStart: false,
        onComplete: true,
        onError: true,
        onApprovalNeeded: false,
        channels: [],
      },
    },
    metadata: {
      tags: ['test'],
      category: 'payments',
      priority: 'MEDIUM',
      environment: 'SANDBOX',
    },
    metrics: {
      totalExecutions: 1,
      successfulExecutions: 1,
      failedExecutions: 0,
      averageExecutionTime: 1000,
      costMetrics: {
        totalCost: 0,
        averageCostPerExecution: 0,
        currency: 'USD',
      },
    },
    ...overrides,
  });
};

export const generateTestJWT = (userId: string, tenantId: string) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { sub: userId, tenantId },
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '1h' }
  );
};
