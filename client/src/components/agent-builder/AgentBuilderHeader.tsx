import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

import type { Agent } from '@types/agent';

import { Badge } from '@components/common/Badge';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';

interface AgentBuilderHeaderProps {
  agentName: string;
  description: string;
  type: Agent['type'];
  isDirty: boolean;
  isValidating: boolean;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onTypeChange: (type: Agent['type']) => void;
  onSave: () => void;
  onDiscard: () => void;
  validationIssues?: string[];
  canRunTest?: boolean;
  onTest?: () => void;
}

export const AgentBuilderHeader: React.FC<AgentBuilderHeaderProps> = ({
  agentName,
  description,
  type,
  isDirty,
  isValidating,
  onNameChange,
  onDescriptionChange,
  onTypeChange,
  onSave,
  onDiscard,
  validationIssues = [],
  canRunTest = false,
  onTest,
}) => {
  const hasBlockingIssues = validationIssues.some((issue) => issue.toLowerCase().includes('required'));

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start lg:items-center space-x-4 flex-1">
          <Link
            to="/agents"
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Back to agents"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>

          <div className="flex-1 grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-center">
            <Input
              value={agentName}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Agent name"
              className="text-lg font-semibold"
            />

            <Input
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Describe the agent goal"
            />

            <select
              value={type}
              onChange={(event) => onTypeChange(event.target.value as Agent['type'])}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="PAYMENT">Payment Agent</option>
              <option value="WORKFLOW">Workflow Agent</option>
              <option value="DATA_PROCESSOR">Data Processor</option>
              <option value="NOTIFICATION">Notification Agent</option>
              <option value="CUSTOM">Custom Agent</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isDirty && (
            <div className="flex items-center space-x-2 text-amber-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Unsaved changes</span>
            </div>
          )}

          <Badge variant="gray" size="sm">
            SANDBOX
          </Badge>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onDiscard} disabled={isValidating}>
              Cancel
            </Button>

            <Button
              onClick={onSave}
              loading={isValidating}
              leftIcon={<DocumentCheckIcon className="h-4 w-4" />}
              disabled={validationIssues.length > 0 && hasBlockingIssues}
            >
              Save Agent
            </Button>

            <Button
              variant="outline"
              leftIcon={<PlayIcon className="h-4 w-4" />}
              disabled={!canRunTest || isValidating}
              onClick={onTest}
            >
              Test Run
            </Button>
          </div>
        </div>
      </div>

      {validationIssues.length > 0 && (
        <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-800">
          <p className="font-semibold">Validation checks</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            {validationIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
