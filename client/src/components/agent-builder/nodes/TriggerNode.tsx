import React, { memo } from 'react';
import type { NodeProps } from 'reactflow';

import { WorkflowStepNode, type WorkflowStepNodeData } from './WorkflowStepNode';

const TriggerNodeComponent: React.FC<NodeProps<WorkflowStepNodeData>> = (props) => (
  <WorkflowStepNode {...props} />
);

export const TriggerNode = memo(TriggerNodeComponent);

TriggerNode.displayName = 'TriggerNode';
