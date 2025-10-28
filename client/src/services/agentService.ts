import { apiClient } from './api';
import type { ApiResponse } from './api';
import type { Agent, AgentAnalytics, AgentConfiguration, AgentExecution, AgentTemplate, CreateAgentData } from '@types/agent';

export interface AgentFilters {
  status?: string;
  type?: string;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExecutionFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AgentListResponse {
  items: Agent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ExecutionHistoryResponse {
  items: AgentExecution[];
  pagination: AgentListResponse['pagination'];
}

const buildSearchParams = (filters?: Record<string, unknown>): string => {
  if (!filters) return '';

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(item => params.append(key, String(item)));
    } else {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
};

const ensureData = <T>(response: ApiResponse<T>, message: string): T => {
  if (!response.success) {
    throw new Error(response.message || message);
  }
  return response.data;
};

class AgentService {
  async getAgents(filters?: AgentFilters): Promise<AgentListResponse> {
    const response = await apiClient.get<AgentListResponse>(`/agents${buildSearchParams(filters)}`);
    return ensureData(response, 'Unable to retrieve agents.');
  }

  async getAgent(id: string): Promise<Agent> {
    const response = await apiClient.get<Agent>(`/agents/${id}`);
    return ensureData(response, 'Unable to retrieve agent details.');
  }

  async createAgent(payload: CreateAgentData): Promise<Agent> {
    const response = await apiClient.post<Agent>('/agents', payload);
    return ensureData(response, 'Unable to create agent.');
  }

  async updateAgent(id: string, payload: Partial<CreateAgentData>): Promise<Agent> {
    const response = await apiClient.put<Agent>(`/agents/${id}`, payload);
    return ensureData(response, 'Unable to update agent.');
  }

  async updateStatus(id: string, status: Agent['status']): Promise<Agent> {
    const response = await apiClient.patch<Agent>(`/agents/${id}/status`, { status });
    return ensureData(response, 'Unable to update agent status.');
  }

  async deleteAgent(id: string): Promise<void> {
    const response = await apiClient.delete(`/agents/${id}`);
    ensureData(response, 'Unable to delete agent.');
  }

  async executeAgent(
    id: string,
    context?: Record<string, unknown>,
    variables?: Record<string, unknown>
  ): Promise<AgentExecution> {
    const response = await apiClient.post<AgentExecution>(`/agents/${id}/execute`, {
      context,
      variables,
    });
    return ensureData(response, 'Unable to execute agent.');
  }

  async getExecutionHistory(id: string, filters?: ExecutionFilters): Promise<ExecutionHistoryResponse> {
    const response = await apiClient.get<ExecutionHistoryResponse>(
      `/agents/${id}/executions${buildSearchParams(filters)}`
    );
    return ensureData(response, 'Unable to fetch execution history.');
  }

  async getAgentAnalytics(id: string): Promise<AgentAnalytics> {
    const response = await apiClient.get<AgentAnalytics>(`/agents/${id}/analytics`);
    return ensureData(response, 'Unable to load analytics.');
  }

  async cloneAgent(id: string, name?: string): Promise<Agent> {
    const response = await apiClient.post<Agent>(`/agents/${id}/clone`, { name });
    return ensureData(response, 'Unable to clone agent.');
  }

  async validateConfiguration(configuration: AgentConfiguration): Promise<{ valid: boolean; errors?: string[] }> {
    const response = await apiClient.post<{ valid: boolean; errors?: string[] }>('/agents/validate', {
      configuration,
    });
    return ensureData(response, 'Unable to validate configuration.');
  }

  async getTemplates(filters?: {
    category?: string;
    search?: string;
    tags?: string[];
    featured?: boolean;
    page?: number;
    limit?: number;
  }): Promise<AgentTemplate[]> {
    const response = await apiClient.get<AgentTemplate[]>(`/agents/templates${buildSearchParams(filters)}`);
    return ensureData(response, 'Unable to retrieve templates.');
  }

  async getTemplate(id: string): Promise<AgentTemplate> {
    const response = await apiClient.get<AgentTemplate>(`/agents/templates/${id}`);
    return ensureData(response, 'Unable to retrieve template.');
  }

  async createFromTemplate(
    templateId: string,
    name: string,
    customization?: Partial<AgentConfiguration>
  ): Promise<Agent> {
    const response = await apiClient.post<Agent>('/agents/from-template', {
      templateId,
      name,
      customization,
    });
    return ensureData(response, 'Unable to create agent from template.');
  }

  async publishAsTemplate(agentId: string, templateData: Partial<AgentTemplate>): Promise<AgentTemplate> {
    const response = await apiClient.post<AgentTemplate>(`/agents/${agentId}/publish`, templateData);
    return ensureData(response, 'Unable to publish template.');
  }

  async getAgentLogs(
    id: string,
    filters?: {
      level?: 'info' | 'warn' | 'error';
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    items: Array<{
      timestamp: string;
      level: string;
      message: string;
      context?: Record<string, unknown>;
    }>;
    pagination: AgentListResponse['pagination'];
  }> {
    const response = await apiClient.get<{ items: Array<{ timestamp: string; level: string; message: string; context?: Record<string, unknown> }>; pagination: AgentListResponse['pagination'] }>(
      `/agents/${id}/logs${buildSearchParams(filters)}`
    );
    return ensureData(response, 'Unable to retrieve agent logs.');
  }

  async testAgent(id: string, testData?: Record<string, unknown>): Promise<{ success: boolean; output?: unknown }>
  {
    const response = await apiClient.post<{ success: boolean; output?: unknown }>(`/agents/${id}/test`, testData);
    return ensureData(response, 'Unable to run agent test.');
  }
}

export const agentService = new AgentService();

export type {
  Agent,
  AgentAnalytics,
  AgentConfiguration,
  AgentExecution,
  AgentTemplate,
  CreateAgentData,
} from '@types/agent';

export type {
  AgentMetadata,
  AgentWorkflowStep,
  AgentTriggerConfig,
  AgentNotificationConfig,
  AgentNotificationChannel,
  AgentConstraints,
  AgentMetrics,
} from '@types/agent';

export type { AgentFilters, ExecutionFilters };
