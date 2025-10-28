import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import { Badge } from '@components/common/Badge';
import { Card, CardBody, CardHeader } from '@components/common/Card';

interface ConditionBranch {
  label: string;
  handleId: string;
  variant: 'success' | 'error';
}

interface ConditionNodeData {
  label: string;
  expression: string;
  trueLabel?: string;
  falseLabel?: string;
}

const branches: ConditionBranch[] = [
  {
    label: 'True',
    handleId: 'true',
    variant: 'success',
  },
  {
    label: 'False',
    handleId: 'false',
    variant: 'error',
  },
];

export const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = memo(({ data, selected }) => {
  return (
    <Card
      className={`min-w-[240px] border-l-4 border-l-warning-500 transition-shadow ${
        selected ? 'ring-2 ring-warning-400' : 'shadow-sm'
      }`}
      padding="sm"
    >
      <Handle type="target" position={Position.Top} className="h-3 w-3 !bg-gray-400" />

      <CardHeader className="flex-col items-start gap-2 pb-3">
        <div className="flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-warning-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-900">{data.label}</span>
        </div>
        <Badge variant="warning" size="sm" className="uppercase tracking-wide">
          Condition
        </Badge>
      </CardHeader>

      <CardBody className="space-y-3">
        <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
          <span className="font-medium text-gray-700">Expression:</span>
          <pre className="mt-1 whitespace-pre-wrap text-xs text-gray-600">{data.expression || 'Configure in properties'}</pre>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-600">
          {branches.map(branch => (
            <div
              key={branch.handleId}
              className="flex items-center justify-between rounded-md border border-dashed border-gray-300 bg-white px-2 py-1"
            >
              <span className="flex items-center gap-1">
                {branch.handleId === 'true' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-success-500" aria-hidden="true" />
                ) : (
                  <XCircleIcon className="h-4 w-4 text-error-500" aria-hidden="true" />
                )}
                {branch.label}
              </span>
              <Badge variant={branch.variant} size="sm">
                {branch.handleId === 'true' ? data.trueLabel ?? 'Success' : data.falseLabel ?? 'Fallback'}
              </Badge>
            </div>
          ))}
        </div>
      </CardBody>

      {branches.map(branch => (
        <Handle
          key={branch.handleId}
          id={branch.handleId}
          type="source"
          position={Position.Bottom}
          className="h-3 w-3 !bg-gray-400"
          style={{ left: branch.handleId === 'true' ? '30%' : '70%' }}
        />
      ))}
    </Card>
  );
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode;
