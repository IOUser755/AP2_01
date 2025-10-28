import React, { memo } from 'react';
import type { NodeProps } from 'reactflow';

import { WorkflowStepNode, type WorkflowStepNodeData } from './WorkflowStepNode';

const ActionNodeComponent: React.FC<NodeProps<WorkflowStepNodeData>> = (props) => (
  <WorkflowStepNode {...props} />
);

export const ActionNode = memo(ActionNodeComponent);

ActionNode.displayName = 'ActionNode';
