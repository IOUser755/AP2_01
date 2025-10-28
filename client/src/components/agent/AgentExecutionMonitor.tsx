import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import {
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import { useWebSocket } from '@hooks/useWebSocket';
import { Card, CardHeader, CardTitle, CardContent } from '@components/common/Card';
import { Badge } from '@components/common/Badge';
import { Progress } from '@components/common/Progress';

interface ExecutionStep {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime?: string | Date;
  endTime?: string | Date;
  output?: unknown;
  error?: string;
}

interface ExecutionPayload {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  steps: ExecutionStep[];
  startTime: string | Date;
}

interface AgentExecutionMonitorProps {
  agentId?: string;
  execution?: ExecutionPayload | null;
}

const statusVariantMap: Record<ExecutionStep['status'], 'secondary' | 'primary' | 'success' | 'error'> = {
  PENDING: 'secondary',
  RUNNING: 'primary',
  COMPLETED: 'success',
  FAILED: 'error',
};

const executionIcon = (status: ExecutionPayload['status']) => {
  switch (status) {
    case 'RUNNING':
      return <PlayIcon className="h-5 w-5 text-blue-500" aria-hidden />;
    case 'COMPLETED':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden />;
    case 'FAILED':
      return <XCircleIcon className="h-5 w-5 text-red-500" aria-hidden />;
    default:
      return <PauseIcon className="h-5 w-5 text-gray-400" aria-hidden />;
  }
};

export const AgentExecutionMonitor: React.FC<AgentExecutionMonitorProps> = ({
  agentId,
  execution: initialExecution,
}) => {
  const { subscribe, connected } = useWebSocket();
  const [execution, setExecution] = useState<ExecutionPayload | null>(initialExecution ?? null);
  const [steps, setSteps] = useState<ExecutionStep[]>(initialExecution?.steps ?? []);

  useEffect(() => {
    if (!initialExecution) {
      setExecution(null);
      setSteps([]);
    }
  }, [initialExecution]);

  useEffect(() => {
    if (!connected || !agentId) {
      return;
    }

    const started = subscribe(`agent:${agentId}:execution:started`, (payload: any) => {
      const nextExecution: ExecutionPayload = {
        id: payload.execution?.id ?? payload.executionId ?? agentId,
        status: payload.execution?.status ?? 'RUNNING',
        steps: payload.execution?.steps ?? [],
        startTime: payload.execution?.startTime ?? new Date().toISOString(),
      };
      setExecution(nextExecution);
      setSteps(nextExecution.steps);
      toast.success(`Agent "${payload.agentName ?? agentId}" execution started`);
    });

    const stepUpdate = subscribe(`agent:${agentId}:step:update`, (payload: any) => {
      setSteps(prev =>
        prev.map(step =>
          step.id === payload.stepId
            ? { ...step, ...payload.stepData }
            : step
        )
      );
    });

    const completed = subscribe(`agent:${agentId}:execution:completed`, (payload: any) => {
      setExecution(prev => (prev ? { ...prev, status: 'COMPLETED' } : prev));
      toast.success(`Agent execution completed successfully${payload?.agentName ? ` for ${payload.agentName}` : ''}`);
    });

    const failed = subscribe(`agent:${agentId}:execution:failed`, (payload: any) => {
      setExecution(prev => (prev ? { ...prev, status: 'FAILED' } : prev));
      toast.error(`Agent execution failed${payload?.error ? `: ${payload.error}` : ''}`);
    });

    return () => {
      started?.();
      stepUpdate?.();
      completed?.();
      failed?.();
    };
  }, [agentId, connected, subscribe]);

  const progress = useMemo(() => {
    if (!steps.length) {
      return 0;
    }
    const completedSteps = steps.filter(step => step.status === 'COMPLETED').length;
    return (completedSteps / steps.length) * 100;
  }, [steps]);

  if (!agentId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-gray-500">
          Select an agent to monitor execution progress.
        </CardContent>
      </Card>
    );
  }

  if (!execution) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <ClockIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" aria-hidden />
          <p className="text-sm text-gray-500">No active execution</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {executionIcon(execution.status)}
          Agent Execution Monitor
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <Badge variant={statusVariantMap[execution.status]}>{execution.status}</Badge>
          <span>
            Started:{' '}
            {new Date(execution.startTime).toLocaleTimeString()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>
              {steps.filter(step => step.status === 'COMPLETED').length}/{steps.length} steps
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={clsx(
                'rounded-lg border p-4 transition-colors',
                step.status === 'RUNNING' && 'border-blue-500 bg-blue-50',
                step.status === 'COMPLETED' && 'border-green-500 bg-green-50',
                step.status === 'FAILED' && 'border-red-500 bg-red-50'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                  <span className="font-medium text-gray-900">{step.name}</span>
                </div>
                <Badge variant={statusVariantMap[step.status]}>{step.status}</Badge>
              </div>

              {step.status === 'RUNNING' && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                  <span className="h-2 w-2 animate-ping rounded-full bg-blue-600" />
                  Processing…
                </div>
              )}

              {step.error && (
                <div className="mt-2 rounded bg-red-100 p-2 text-sm text-red-600">
                  {step.error}
                </div>
              )}

              {step.output && step.status === 'COMPLETED' && (
                <div className="mt-2 text-sm text-gray-600">
                  <details>
                    <summary className="cursor-pointer">View output</summary>
                    <pre className="mt-2 max-h-48 overflow-auto rounded bg-gray-100 p-2 text-xs">
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
