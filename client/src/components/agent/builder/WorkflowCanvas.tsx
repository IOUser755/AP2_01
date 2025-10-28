import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  addEdge,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnConnect,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { NodePropertyPanel } from './NodePropertyPanel';
import { Sidebar } from './Sidebar';
import { WorkflowValidator } from './WorkflowValidator';
import { ActionNode } from './nodes/ActionNode';
import { ConditionNode } from './nodes/ConditionNode';
import { OutputNode } from './nodes/OutputNode';
import { TriggerNode } from './nodes/TriggerNode';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  output: OutputNode,
};

const AUTOSAVE_DELAY = 800;

interface WorkflowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave: (nodes: Node[], edges: Edge[]) => void;
  readonly?: boolean;
}

type DefaultConfig = Record<string, unknown>;

const getDefaultConfig = (type: string): DefaultConfig => {
  switch (type) {
    case 'trigger':
      return {
        triggerType: 'manual',
        description: 'Start this agent manually or via API call.',
      };
    case 'action':
      return {
        toolType: 'http_request',
        parameters: {},
        status: 'idle',
      };
    case 'condition':
      return {
        expression: '',
        trueLabel: 'Success',
        falseLabel: 'Fallback',
      };
    case 'output':
      return {
        format: 'json',
        template: '{"status":"success"}',
      };
    default:
      return {};
  }
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  initialNodes = [],
  initialEdges = [],
  onSave,
  readonly = false,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  useEffect(() => {
    if (selectedNodeId && !nodes.some(node => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [nodes, selectedNodeId]);

  const selectedNode = useMemo(
    () => nodes.find(node => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const onConnect = useCallback<OnConnect>(
    connection => {
      setEdges(previous =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            style: { stroke: '#0ea5e9' },
          },
          previous
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label') || 'New step';

      if (!type || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label,
          ...getDefaultConfig(type),
        },
      };

      setNodes(previous => [...previous, newNode]);
      setSelectedNodeId(newNode.id);
    },
    [reactFlowInstance, setNodes]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const handleSelectionChange = useCallback((params: { nodes: Node[]; edges: Edge[] }) => {
    const primaryNode = params.nodes[0];
    setSelectedNodeId(primaryNode ? primaryNode.id : null);
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, updates: Record<string, unknown>) => {
      setNodes(current =>
        current.map(node =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...updates,
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes(current => current.filter(node => node.id !== nodeId));
      setEdges(current => current.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setEdges, setNodes]
  );

  useEffect(() => {
    if (readonly) {
      return;
    }

    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const timeout = setTimeout(() => {
      onSave(nodes, edges);
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(timeout);
  }, [edges, nodes, onSave, readonly]);

  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];

    if (nodes.length === 0) {
      errors.push('Add at least one node to begin building a workflow.');
      return errors;
    }

    const triggerNodes = nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must include at least one trigger node.');
    }

    const outputNodes = nodes.filter(node => node.type === 'output');
    if (outputNodes.length === 0) {
      errors.push('Add an output node to capture or emit the workflow results.');
    }

    const connectedTargets = new Set(edges.map(edge => edge.target));
    nodes.forEach(node => {
      if (node.type !== 'trigger' && !connectedTargets.has(node.id)) {
        const name = (node.data as Record<string, unknown>)?.label ?? node.id;
        errors.push(`Step "${name}" is not connected to a preceding node.`);
      }
    });

    const knownNodeIds = new Set(nodes.map(node => node.id));
    const danglingEdges = edges.filter(edge => !knownNodeIds.has(edge.source) || !knownNodeIds.has(edge.target));
    if (danglingEdges.length > 0) {
      errors.push('Some connections reference missing nodes. Remove and recreate those edges.');
    }

    return errors;
  }, [edges, nodes]);

  return (
    <div className="flex h-full min-h-[720px] bg-gray-100">
      {!readonly && <Sidebar />}
      <div className="relative flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onSelectionChange={handleSelectionChange}
          fitView
          connectionMode={ConnectionMode.Loose}
          nodesDraggable={!readonly}
          nodesConnectable={!readonly}
          elementsSelectable
          panOnScroll
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          proOptions={{ hideAttribution: true }}
          className="!bg-gray-50"
        >
          <MiniMap pannable zoomable className="!bg-white/90" />
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
        </ReactFlow>
      </div>
      {!readonly && (
        <div className="w-80 border-l border-gray-200 bg-white/80 p-5 backdrop-blur">
          <WorkflowValidator
            onValidate={validateWorkflow}
            nodesCount={nodes.length}
            edgesCount={edges.length}
          />
          <div className="mt-6">
            <NodePropertyPanel
              selectedNode={selectedNode}
              onUpdateNode={updateNodeData}
              onDeleteNode={deleteNode}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowCanvas;
