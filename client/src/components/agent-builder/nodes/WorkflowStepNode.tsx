import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

import type { WorkflowStep } from '@types/agent';

export interface WorkflowStepNodeData {
  step: WorkflowStep;
  onEdit: (stepId: string) => void;
  onDelete: (stepId: string) => void;
}

const typeStyles: Record<WorkflowStep['type'], string> = {
  TRIGGER: 'border-blue-500 bg-blue-50',
  ACTION: 'border-green-500 bg-green-50',
  CONDITION: 'border-yellow-500 bg-yellow-50',
  APPROVAL: 'border-purple-500 bg-purple-50',
};

const typeEmoji: Record<WorkflowStep['type'], string> = {
  TRIGGER: '⚡',
  ACTION: '🔧',
  CONDITION: '❓',
  APPROVAL: '✅',
};

export const WorkflowStepNode: React.FC<NodeProps<WorkflowStepNodeData>> = memo(
  ({ data, selected }) => {
    const { step, onEdit, onDelete } = data;

    return (
      <div
        className={clsx(
          'min-w-[200px] rounded-lg border-2 bg-white shadow-sm transition-all',
          typeStyles[step.type],
          selected && 'ring-2 ring-primary-500 ring-offset-2'
        )}
      >
        {step.type !== 'TRIGGER' && (
          <Handle
            type="target"
            position={Position.Top}
            id="input"
            className="!w-3 !h-3 !bg-gray-400"
          />
        )}

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{typeEmoji[step.type]}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{step.name}</p>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">{step.type}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => onEdit(step.id)}
                className="p-1 rounded hover:bg-white/60"
                title="Configure step"
              >
                <PencilIcon className="h-3.5 w-3.5 text-gray-500" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(step.id)}
                className="p-1 rounded hover:bg-white/60"
                title="Remove step"
              >
                <TrashIcon className="h-3.5 w-3.5 text-red-500" />
              </button>
            </div>
          </div>

          {step.description && (
            <p className="text-xs text-gray-600">{step.description}</p>
          )}

          <div className="flex items-center space-x-1 text-xs">
            {step.toolType ? (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                <span className="truncate">{step.toolType}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-amber-600">
                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                <span>Needs configuration</span>
              </div>
            )}
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          id="success"
          className="!w-3 !h-3 !bg-green-500"
          style={{ left: '30%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="failure"
          className="!w-3 !h-3 !bg-red-500"
          style={{ left: '70%' }}
        />

        {step.type === 'CONDITION' && step.connections.conditions?.map((_, index) => (
          <Handle
            key={`condition-${index}`}
            type="source"
            position={Position.Right}
            id={`condition-${index}`}
            className="!w-3 !h-3 !bg-yellow-500"
            style={{ top: `${35 + index * 20}%` }}
          />
        ))}
      </div>
    );
  }
);

WorkflowStepNode.displayName = 'WorkflowStepNode';
