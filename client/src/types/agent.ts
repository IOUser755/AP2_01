export type AgentStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'ERROR';
export type AgentType = 'PAYMENT' | 'WORKFLOW' | 'DATA_PROCESSOR' | 'NOTIFICATION' | 'CUSTOM';

export interface AgentMetadata {
  tags: string[];
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  environment: 'SANDBOX' | 'PRODUCTION';
}

export interface AgentConfiguration {
  workflow: Array<Record<string, unknown>>;
  tools: Array<Record<string, unknown>>;
  triggers: Array<Record<string, unknown>>;
  variables: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  notifications?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  _id?: string;
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
  metrics?: Record<string, unknown>;
  lastExecutedAt?: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTemplate {
  id: string;
  _id?: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  version: string;
  price: {
    amount: number;
    currency: string;
    type: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION';
  };
}

export interface AgentAnalytics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionTime?: number;
  totalAmountProcessed?: {
    amount: number;
    currency: string;
  };
  costMetrics?: Record<string, unknown>;
}

export interface AgentExecution {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  context?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

export interface AgentListResponse {
  agents: Agent[];
  page: number;
  limit: number;
  total: number;
}

export interface AgentExecutionsResponse {
  executions: AgentExecution[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateAgentData {
  name: string;
  description?: string;
  type: AgentType;
  configuration: AgentConfiguration;
  metadata?: Partial<AgentMetadata>;
  templateId?: string;
}

export interface UpdateAgentData extends Partial<CreateAgentData> {
  status?: AgentStatus;
}
