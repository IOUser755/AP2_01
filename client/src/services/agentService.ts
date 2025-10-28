import { apiClient } from './api';
import type { ApiResponse } from './api';

import type {
  Agent,
  AgentAnalytics,
  AgentExecutionsResponse,
  AgentListResponse,
  AgentTemplate,
  CreateAgentData,
  UpdateAgentData,
} from '@types/agent';

const ensureData = <T>(response: ApiResponse<T>, fallbackMessage: string): T => {
  if (!response.success || !response.data) {
    throw new Error(response.message || fallbackMessage);
  }
  return response.data;
};

const normalizeAgent = (agent: Agent): Agent => ({
  ...agent,
  id: agent.id ?? agent._id ?? '',
});

export const agentService = {
  async getAgents(filters?: Record<string, unknown>): Promise<AgentListResponse> {
    const response = await apiClient.get<AgentListResponse>('/agents', {
      params: filters,
    });
    const data = ensureData(response, 'Unable to fetch agents');
    return {
      ...data,
      agents: data.agents.map(normalizeAgent),
    };
  },

  async getAgent(id: string): Promise<Agent> {
    const response = await apiClient.get<{ agent: Agent }>(`/agents/${id}`);
    const data = ensureData(response, 'Unable to fetch agent');
    return normalizeAgent(data.agent);
  },

  async createAgent(payload: CreateAgentData): Promise<Agent> {
    const response = await apiClient.post<{ agent: Agent }>('/agents', payload);
    const data = ensureData(response, 'Unable to create agent');
    return normalizeAgent(data.agent);
  },

  async updateAgent(id: string, payload: UpdateAgentData): Promise<Agent> {
    const response = await apiClient.patch<{ agent: Agent }>(`/agents/${id}`, payload);
    const data = ensureData(response, 'Unable to update agent');
    return normalizeAgent(data.agent);
  },

  async deleteAgent(id: string): Promise<void> {
    const response = await apiClient.delete(`/agents/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Unable to delete agent');
    }
  },

  async executeAgent(
    id: string,
    context?: Record<string, unknown>,
    variables?: Record<string, unknown>
  ): Promise<{ executionId: string }> {
    const response = await apiClient.post<{ executionId: string }>(`/agents/${id}/execute`, {
      context,
      variables,
    });
    return ensureData(response, 'Unable to execute agent');
  },

  async getAgentAnalytics(id: string): Promise<AgentAnalytics> {
    const response = await apiClient.get<{ analytics: AgentAnalytics }>(`/agents/${id}/analytics`);
    const data = ensureData(response, 'Unable to fetch agent analytics');
    return data.analytics;
  },

  async getExecutionHistory(
    id: string,
    filters?: Record<string, unknown>
  ): Promise<AgentExecutionsResponse> {
    const response = await apiClient.get<AgentExecutionsResponse>(`/agents/${id}/executions`, {
      params: filters,
    });
    return ensureData(response, 'Unable to fetch agent executions');
  },

  async cloneAgent(id: string, name?: string): Promise<Agent> {
    const response = await apiClient.post<{ agent: Agent }>(`/agents/${id}/clone`, { name });
    const data = ensureData(response, 'Unable to clone agent');
    return normalizeAgent(data.agent);
  },

  async getTemplates(filters?: Record<string, unknown>): Promise<{ templates: AgentTemplate[] }> {
    const response = await apiClient.get<{ templates: AgentTemplate[] }>('/templates', {
      params: filters,
    });
    return ensureData(response, 'Unable to fetch templates');
  },
};
