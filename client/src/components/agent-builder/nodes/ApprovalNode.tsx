import React, { memo } from 'react';
import type { NodeProps } from 'reactflow';

import { WorkflowStepNode, type WorkflowStepNodeData } from './WorkflowStepNode';

const ApprovalNodeComponent: React.FC<NodeProps<WorkflowStepNodeData>> = (props) => (
  <WorkflowStepNode {...props} />
);

export const ApprovalNode = memo(ApprovalNodeComponent);

ApprovalNode.displayName = 'ApprovalNode';
