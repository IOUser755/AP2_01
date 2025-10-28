import React, { memo } from 'react';
import type { NodeProps } from 'reactflow';

import { WorkflowStepNode, type WorkflowStepNodeData } from './WorkflowStepNode';

const ConditionNodeComponent: React.FC<NodeProps<WorkflowStepNodeData>> = (props) => (
  <WorkflowStepNode {...props} />
);

export const ConditionNode = memo(ConditionNodeComponent);

ConditionNode.displayName = 'ConditionNode';
