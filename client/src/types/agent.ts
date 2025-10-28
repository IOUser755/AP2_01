export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'ERROR';
export type AgentType = 'PAYMENT' | 'WORKFLOW' | 'DATA_PROCESSOR' | 'NOTIFICATION' | 'CUSTOM';

export interface AgentMetadata {
  tags: string[];
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  environment: 'SANDBOX' | 'PRODUCTION';
}

export interface AgentWorkflowConnectionCondition {
  condition: string;
  nextStepId: string;
}

export interface AgentWorkflowErrorHandling {
  strategy: 'STOP' | 'CONTINUE' | 'RETRY' | 'ROLLBACK';
  maxRetries?: number;
  fallbackStepId?: string;
}

export interface AgentWorkflowStep {
  id: string;
  type: 'TRIGGER' | 'ACTION' | 'CONDITION' | 'APPROVAL';
  name: string;
  description?: string;
  toolType: string;
  parameters: Record<string, unknown>;
  position: { x: number; y: number };
  connections: {
    success?: string;
    failure?: string;
    conditions?: AgentWorkflowConnectionCondition[];
  };
  errorHandling: AgentWorkflowErrorHandling;
  timeout?: number;
}

export interface AgentToolConfig {
  type: string;
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface AgentTriggerConfig {
  type: 'WEBHOOK' | 'SCHEDULE' | 'MANUAL' | 'EVENT';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface AgentConstraints {
  budgetLimit?: {
    amount: number;
    currency: string;
    period: 'TRANSACTION' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  };
  timeLimit?: {
    maxExecutionTime: number;
    timeZone: string;
  };
  approvalRequired: boolean;
  geoRestrictions?: string[];
}

export type AgentNotificationChannelType = 'EMAIL' | 'WEBHOOK' | 'SLACK' | 'SMS';

export interface AgentNotificationChannel {
  type: AgentNotificationChannelType;
  config: Record<string, unknown>;
}

export interface AgentNotificationConfig {
  onStart: boolean;
  onComplete: boolean;
  onError: boolean;
  onApprovalNeeded: boolean;
  channels: AgentNotificationChannel[];
}

export interface AgentConfiguration {
  workflow: AgentWorkflowStep[];
  tools: AgentToolConfig[];
  triggers: AgentTriggerConfig[];
  variables: Record<string, unknown>;
  constraints: AgentConstraints;
  notifications: AgentNotificationConfig;
}

export interface AgentMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionTime?: number;
  totalAmountProcessed?: {
    amount: number;
    currency: string;
  };
  costMetrics: {
    totalCost: number;
    averageCostPerExecution: number;
    currency: string;
  };
}

export interface Agent {
  _id: string;
  tenantId: string;
  createdBy: string;
  name: string;
  description?: string;
  type: AgentType;
  status: AgentStatus;
  version: string;
  templateId?: string;
  configuration: AgentConfiguration;
  metadata: AgentMetadata;
  metrics: AgentMetrics;
  lastExecutedAt?: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentData {
  name: string;
  description?: string;
  type: AgentType;
  configuration: AgentConfiguration;
  metadata: AgentMetadata;
  templateId?: string;
}

export interface AgentExecutionStep {
  stepId: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface AgentExecution {
  _id: string;
  agentId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  context: Record<string, unknown>;
  variables: Record<string, unknown>;
  steps: AgentExecutionStep[];
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  createdAt: string;
}

export interface AgentAnalytics {
  overview: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    lastExecutedAt?: string;
  };
  performance: {
    totalCost: number;
    averageCostPerExecution: number;
    totalAmountProcessed?: {
      amount: number;
      currency: string;
    };
  };
  trends: {
    daily: Array<{ date: string; executions: number; successRate: number; avgDuration: number }>;
    weekly: Array<{ week: string; executions: number; successRate: number; avgDuration: number }>;
    monthly: Array<{ month: string; executions: number; successRate: number; avgDuration: number }>;
  };
}

export interface AgentTemplate {
  _id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  publishedBy: string;
  templateConfig: AgentConfiguration;
  usageCount: number;
  rating: {
    average: number;
    totalReviews: number;
  };
  price: {
    amount: number;
    currency: string;
    type: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION';
  };
  screenshots: string[];
  documentation: {
    readme: string;
    setupInstructions: string;
    examples: Array<{
      name: string;
      description: string;
      configuration: Record<string, unknown>;
    }>;
  };
  version: string;
  changelog: Array<{
    version: string;
    changes: string[];
    releasedAt: string;
  }>;
  compatibility: {
    minPlatformVersion: string;
    supportedTools: string[];
    requiredPermissions: string[];
  };
  isActive: boolean;
  featuredAt?: string;
  createdAt: string;
  updatedAt: string;
}
