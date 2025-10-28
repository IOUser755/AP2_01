import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { agentService } from '@services/agentService';
import type { Agent, CreateAgentData } from '@types/agent';
import type { AgentFilters, ExecutionFilters } from '@services/agentService';

const QUERY_KEYS = {
  agents: ['agents'] as const,
  agent: (id: string) => ['agents', id] as const,
  agentAnalytics: (id: string) => ['agents', id, 'analytics'] as const,
  agentExecutions: (id: string) => ['agents', id, 'executions'] as const,
  templates: ['agent-templates'] as const,
};

export const useAgents = (filters?: AgentFilters) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.agents, filters],
    queryFn: () => agentService.getAgents(filters),
    staleTime: 1000 * 60 * 5,
  });
};

export const useAgent = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.agent(id),
    queryFn: () => agentService.getAgent(id),
    enabled: Boolean(id),
  });
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAgentData) => agentService.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
      toast.success('Agent created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Failed to create agent');
    },
  });
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateAgentData> & { status?: Agent['status'] };
    }) => {
      if (data.status) {
        return agentService.updateStatus(id, data.status);
      }
      return agentService.updateAgent(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agent(variables.id) });
      toast.success('Agent updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Failed to update agent');
    },
  });
};

export const useDeleteAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => agentService.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
      toast.success('Agent deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Failed to delete agent');
    },
  });
};

export const useExecuteAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      context,
      variables,
    }: {
      id: string;
      context?: Record<string, unknown>;
      variables?: Record<string, unknown>;
    }) => agentService.executeAgent(id, context, variables),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.agent(id) });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agent(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentExecutions(variables.id) });
      toast.success('Agent execution started');
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Failed to execute agent');
    },
  });
};

export const useAgentAnalytics = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.agentAnalytics(id),
    queryFn: () => agentService.getAgentAnalytics(id),
    enabled: Boolean(id),
    refetchInterval: 30000,
  });
};

export const useAgentExecutions = (id: string, filters?: ExecutionFilters) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.agentExecutions(id), filters],
    queryFn: () => agentService.getExecutionHistory(id, filters),
    enabled: Boolean(id),
  });
};

export const useCloneAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) => agentService.cloneAgent(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
      toast.success('Agent cloned successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Failed to clone agent');
    },
  });
};

export const useAgentTemplates = (filters?: {
  category?: string;
  search?: string;
  tags?: string[];
  featured?: boolean;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.templates, filters],
    queryFn: () => agentService.getTemplates(filters),
    staleTime: 1000 * 60 * 10,
  });
};
