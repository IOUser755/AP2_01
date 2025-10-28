import React, { useState } from 'react';
import { BeakerIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import type { AgentConfiguration } from '@types/agent';

import { Button } from '@components/common/Button';
import { useExecuteAgent } from '@hooks/useAgents';

interface TestingPanelProps {
  configuration: AgentConfiguration;
  agentId?: string;
}

interface ExecutionPreview {
  success: boolean;
  timestamp: string;
  message: string;
}

export const TestingPanel: React.FC<TestingPanelProps> = ({ configuration, agentId }) => {
  const executeAgent = useExecuteAgent();
  const [contextInput, setContextInput] = useState(`{
  "tenant": "sandbox"
}`);
  const [variablesInput, setVariablesInput] = useState('{}');
  const [preview, setPreview] = useState<ExecutionPreview | null>(null);

  const handleTestRun = async () => {
    if (!agentId) {
      toast.error('Save the agent before running a test.');
      return;
    }

    let context: Record<string, unknown> = {};
    let variables: Record<string, unknown> = {};

    try {
      context = contextInput.trim() ? JSON.parse(contextInput) : {};
      variables = variablesInput.trim() ? JSON.parse(variablesInput) : {};
    } catch (error) {
      toast.error('Context and variables must be valid JSON.');
      return;
    }

    try {
      const result = await executeAgent.mutateAsync({ id: agentId, context, variables });
      setPreview({
        success: true,
        timestamp: new Date().toISOString(),
        message: result?.message ?? 'Execution started successfully.',
      });
    } catch (error: any) {
      setPreview({
        success: false,
        timestamp: new Date().toISOString(),
        message: error?.message ?? 'Failed to start execution.',
      });
    }
  };

  const workflowReady = configuration.workflow.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <section className="space-y-2">
        <div className="flex items-center space-x-2">
          <BeakerIcon className="h-5 w-5 text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-900">Sandbox execution</h3>
        </div>
        <p className="text-xs text-gray-500">
          Run the workflow using sandbox credentials. Executions are enqueued asynchronously and
          results will stream to the activity panel.
        </p>
      </section>

      <section className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Execution context</label>
          <textarea
            value={contextInput}
            onChange={(event) => setContextInput(event.target.value)}
            className="w-full h-32 rounded-md border border-gray-300 text-xs font-mono p-3 focus:border-primary-500 focus:ring-primary-500"
            spellCheck={false}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Runtime variables</label>
          <textarea
            value={variablesInput}
            onChange={(event) => setVariablesInput(event.target.value)}
            className="w-full h-24 rounded-md border border-gray-300 text-xs font-mono p-3 focus:border-primary-500 focus:ring-primary-500"
            spellCheck={false}
          />
        </div>

        <Button
          onClick={handleTestRun}
          loading={executeAgent.isPending}
          disabled={!workflowReady || executeAgent.isPending}
        >
          Run test
        </Button>

        {!workflowReady && (
          <p className="text-xs text-amber-600">
            Add at least one step to the workflow before running a test execution.
          </p>
        )}
      </section>

      {preview && (
        <section className="rounded-md border p-4 text-xs">
          <div className="flex items-center space-x-2">
            {preview.success ? (
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
            ) : (
              <XCircleIcon className="h-4 w-4 text-red-500" />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {preview.success ? 'Execution queued' : 'Execution failed to start'}
              </p>
              <p className="text-[11px] text-gray-500">{new Date(preview.timestamp).toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-2 text-gray-600">{preview.message}</p>
        </section>
      )}
    </div>
  );
};
