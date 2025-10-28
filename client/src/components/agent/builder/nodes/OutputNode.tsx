import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  ArrowDownOnSquareIcon,
  CheckCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

import { Badge } from '@components/common/Badge';
import { Card, CardBody, CardHeader } from '@components/common/Card';

interface OutputNodeData {
  label: string;
  format: 'json' | 'webhook' | 'notification';
  template?: string;
  status?: 'idle' | 'ready';
}

const formatLabels: Record<OutputNodeData['format'], string> = {
  json: 'JSON Response',
  webhook: 'Webhook',
  notification: 'Notification',
};

export const OutputNode: React.FC<NodeProps<OutputNodeData>> = memo(({ data, selected }) => {
  const isReady = data.status === 'ready';

  return (
    <Card
      className={`min-w-[220px] border-l-4 border-l-sky-500 transition-shadow ${
        selected ? 'ring-2 ring-sky-400' : 'shadow-sm'
      }`}
      padding="sm"
    >
      <Handle type="target" position={Position.Top} className="h-3 w-3 !bg-gray-400" />

      <CardHeader className="flex-col items-start gap-2 pb-3">
        <div className="flex items-center gap-2">
          {isReady ? (
            <CheckCircleIcon className="h-5 w-5 text-success-500" aria-hidden="true" />
          ) : (
            <ArrowDownOnSquareIcon className="h-5 w-5 text-sky-500" aria-hidden="true" />
          )}
          <span className="text-sm font-semibold text-gray-900">{data.label}</span>
        </div>
        <Badge variant="primary" size="sm" className="uppercase tracking-wide">
          {formatLabels[data.format] ?? data.format}
        </Badge>
      </CardHeader>

      {data.template && (
        <CardBody className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-1 font-medium text-gray-700">
            <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
            Output Template
          </div>
          <pre className="max-h-40 overflow-auto rounded-md bg-gray-50 p-2">{data.template}</pre>
        </CardBody>
      )}

      <Handle type="source" position={Position.Bottom} className="h-3 w-3 !bg-gray-400" />
    </Card>
  );
});

OutputNode.displayName = 'OutputNode';

export default OutputNode;
