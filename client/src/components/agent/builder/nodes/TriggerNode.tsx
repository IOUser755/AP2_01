import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { BoltIcon, PlayCircleIcon } from '@heroicons/react/24/outline';

import { Badge } from '@components/common/Badge';
import { Card, CardBody, CardHeader } from '@components/common/Card';

interface TriggerNodeData {
  label: string;
  triggerType: 'manual' | 'schedule' | 'webhook' | 'event';
  description?: string;
}

const triggerCopy: Record<TriggerNodeData['triggerType'], string> = {
  manual: 'Manual',
  schedule: 'Scheduled',
  webhook: 'Webhook',
  event: 'Event',
};

export const TriggerNode: React.FC<NodeProps<TriggerNodeData>> = memo(({ data, selected }) => {
  const icon =
    data.triggerType === 'manual' ? (
      <PlayCircleIcon className="h-5 w-5 text-primary-500" aria-hidden="true" />
    ) : (
      <BoltIcon className="h-5 w-5 text-primary-500" aria-hidden="true" />
    );

  return (
    <Card
      className={`min-w-[220px] border-l-4 border-l-emerald-500 transition-shadow ${
        selected ? 'ring-2 ring-emerald-400' : 'shadow-sm'
      }`}
      padding="sm"
    >
      <Handle type="source" position={Position.Bottom} className="h-3 w-3 !bg-gray-400" />

      <CardHeader className="flex-col items-start gap-2 pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-gray-900">{data.label}</span>
        </div>
        <Badge variant="success" size="sm" className="uppercase tracking-wide">
          {triggerCopy[data.triggerType] ?? data.triggerType}
        </Badge>
      </CardHeader>

      {data.description && (
        <CardBody className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-700">
          {data.description}
        </CardBody>
      )}
    </Card>
  );
});

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode;
