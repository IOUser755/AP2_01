import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  CheckCircleIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import { Badge } from '@components/common/Badge';
import { Card, CardBody, CardHeader } from '@components/common/Card';

interface ActionNodeData {
  label: string;
  toolType: string;
  parameters: Record<string, unknown>;
  status?: 'idle' | 'running' | 'completed' | 'error';
  error?: string;
}

const statusVariantMap: Record<NonNullable<ActionNodeData['status']>, 'primary' | 'success' | 'error' | 'gray'> = {
  idle: 'gray',
  running: 'primary',
  completed: 'success',
  error: 'error',
};

const statusIconMap: Record<NonNullable<ActionNodeData['status']>, React.ReactNode> = {
  idle: <Cog6ToothIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />,
  running: (
    <div
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"
    />
  ),
  completed: <CheckCircleIcon className="h-4 w-4 text-green-500" aria-hidden="true" />,
  error: <ExclamationTriangleIcon className="h-4 w-4 text-error-500" aria-hidden="true" />,
};

export const ActionNode: React.FC<NodeProps<ActionNodeData>> = memo(({ data, selected }) => {
  const status = data.status ?? 'idle';
  const statusBadge =
    status === 'idle' ? null : (
      <Badge variant={statusVariantMap[status]} size="sm" className="capitalize">
        {status}
      </Badge>
    );

  return (
    <Card
      className={`min-w-[220px] border-l-4 border-l-primary-500 transition-shadow ${
        selected ? 'ring-2 ring-primary-400' : 'shadow-sm'
      }`}
      padding="sm"
    >
      <Handle type="target" position={Position.Top} className="h-3 w-3 !bg-gray-400" />

      <CardHeader className="flex-col items-start gap-2 pb-3">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {statusIconMap[status]}
            <span className="text-sm font-semibold text-gray-900">{data.label}</span>
          </div>
          {statusBadge}
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          <span className="rounded bg-primary-100 px-1.5 py-0.5 text-primary-700">Action</span>
          {data.toolType}
        </span>
      </CardHeader>

      {data.error && (
        <CardBody className="rounded-md bg-error-50 p-2 text-xs text-error-600">
          {data.error}
        </CardBody>
      )}

      <Handle type="source" position={Position.Bottom} className="h-3 w-3 !bg-gray-400" />
    </Card>
  );
});

ActionNode.displayName = 'ActionNode';

export default ActionNode;
