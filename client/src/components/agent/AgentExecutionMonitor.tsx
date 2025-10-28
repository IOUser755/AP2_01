import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import { useWebSocket } from '@hooks/useWebSocket';
import { Card, CardHeader, CardTitle, CardBody } from '@components/common/Card';
import { Badge } from '@components/common/Badge';
import { Progress } from '@components/common/Progress';

interface ExecutionStep {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime?: Date;
  endTime?: Date;
  output?: any;
  error?: string;
}

interface AgentExecutionMonitorProps {
  agentId: string | null;
  execution?: {
    id: string;
    status: string;
    steps: ExecutionStep[];
    startTime: Date;
  } | null;
}

export const AgentExecutionMonitor: React.FC<AgentExecutionMonitorProps> = ({
  agentId,
  execution: initialExecution,
}) => {
  const { subscribe, connected } = useWebSocket();
  const [execution, setExecution] = useState(initialExecution ?? null);
  const [realTimeSteps, setRealTimeSteps] = useState<ExecutionStep[]>(initialExecution?.steps ?? []);

  useEffect(() => {
    setExecution(initialExecution ?? null);
    setRealTimeSteps(initialExecution?.steps ?? []);
  }, [initialExecution]);

  useEffect(() => {
    if (!connected || !agentId) {
      return;
    }

    const unsubscribeStart = subscribe(`agent:${agentId}:execution:started`, data => {
      setExecution(data.execution ?? null);
      setRealTimeSteps(data.execution?.steps ?? []);
      if (data.agentName) {
        toast.success(`Agent "${data.agentName}" started execution`);
      }
    });

    const unsubscribeStep = subscribe(`agent:${agentId}:step:update`, data => {
      setRealTimeSteps(prev =>
        prev.map(step => (step.id === data.stepId ? { ...step, ...data.stepData } : step))
      );
    });

    const unsubscribeComplete = subscribe(`agent:${agentId}:execution:completed`, data => {
      setExecution(prev => (prev ? { ...prev, status: 'COMPLETED' } : prev));
      if (data?.agentName) {
        toast.success(`Agent "${data.agentName}" completed successfully`);
      } else {
        toast.success('Agent execution completed successfully');
      }
    });

    const unsubscribeFailed = subscribe(`agent:${agentId}:execution:failed`, data => {
      setExecution(prev => (prev ? { ...prev, status: 'FAILED' } : prev));
      if (data?.error) {
        toast.error(`Agent execution failed: ${data.error}`);
      } else {
        toast.error('Agent execution failed');
      }
    });

    return () => {
      unsubscribeStart?.();
      unsubscribeStep?.();
      unsubscribeComplete?.();
      unsubscribeFailed?.();
    };
  }, [agentId, connected, subscribe]);

  if (!execution) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
          <ClockIcon className="mb-4 h-12 w-12 text-gray-400" />
          <p>No active execution</p>
        </CardBody>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <PlayIcon className="h-5 w-5 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <PauseIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ExecutionStep['status'] | string) => {
    const variants: Record<string, 'primary' | 'secondary' | 'success' | 'error'> = {
      PENDING: 'secondary',
      RUNNING: 'primary',
      COMPLETED: 'success',
      FAILED: 'error',
    };

    const variant = variants[status] ?? 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const completedSteps = realTimeSteps.filter(step => step.status === 'COMPLETED').length;
  const progress = realTimeSteps.length > 0 ? (completedSteps / realTimeSteps.length) * 100 : 0;

  return (
    <Card>
      <CardHeader className="items-start justify-between">
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(execution.status)}
          Agent Execution Monitor
        </CardTitle>
        <div className="flex flex-col items-end gap-1 text-sm text-gray-500">
          {getStatusBadge(execution.status)}
          <span>Started: {new Date(execution.startTime).toLocaleTimeString()}</span>
        </div>
      </CardHeader>
      <CardBody>
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span>Progress</span>
            <span>
              {completedSteps}/{realTimeSteps.length || 0} steps
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3">
          {realTimeSteps.length === 0 ? (
            <p className="text-center text-sm text-gray-500">Awaiting execution steps...</p>
          ) : (
            realTimeSteps.map((step, index) => (
              <div
                key={step.id}
                className={`rounded-lg border p-4 transition-all duration-300 ${
                  step.status === 'RUNNING'
                    ? 'border-blue-500 bg-blue-50'
                    : step.status === 'COMPLETED'
                    ? 'border-green-500 bg-green-50'
                    : step.status === 'FAILED'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                    <span className="font-medium text-gray-900">{step.name}</span>
                  </div>
                  {getStatusBadge(step.status)}
                </div>

                {step.status === 'RUNNING' && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" />
                      Processing...
                    </div>
                  </div>
                )}

                {step.error && (
                  <div className="mt-2 rounded bg-red-100 p-2 text-sm text-red-600">{step.error}</div>
                )}

                {step.output && step.status === 'COMPLETED' && (
                  <div className="mt-2 text-sm text-gray-600">
                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-gray-700">View output</summary>
                      <pre className="mt-2 max-h-64 overflow-auto rounded bg-gray-100 p-2 text-xs">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default AgentExecutionMonitor;
