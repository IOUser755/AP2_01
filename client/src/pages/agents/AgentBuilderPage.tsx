import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Background,
  Connection,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from 'reactflow';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { AgentBuilderHeader } from '@components/agent-builder/AgentBuilderHeader';
import { AgentBuilderSidebar } from '@components/agent-builder/AgentBuilderSidebar';
import { ConstraintsPanel } from '@components/agent-builder/ConstraintsPanel';
import { StepConfigModal } from '@components/agent-builder/StepConfigModal';
import { TestingPanel } from '@components/agent-builder/TestingPanel';
import { ActionNode } from '@components/agent-builder/nodes/ActionNode';
import { ApprovalNode } from '@components/agent-builder/nodes/ApprovalNode';
import { ConditionNode } from '@components/agent-builder/nodes/ConditionNode';
import { TriggerNode } from '@components/agent-builder/nodes/TriggerNode';
import {
  WorkflowStepNode,
  type WorkflowStepNodeData,
} from '@components/agent-builder/nodes/WorkflowStepNode';
import {
  BUILDER_TOOL_DEFINITIONS,
  type BuilderPanel,
} from '@components/agent-builder/toolLibrary';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import {
  useAgent,
  useCreateAgent,
  useUpdateAgent,
} from '@hooks/useAgents';
import { generateId } from '@utils';
import type {
  Agent,
  AgentConfiguration,
  CreateAgentData,
  WorkflowStep,
} from '@types/agent';

const DRAFT_STORAGE_KEY = 'agentpayhub-agent-builder-draft';

const DEFAULT_CONFIGURATION: AgentConfiguration = {
  workflow: [],
  tools: [],
  triggers: [
    {
      type: 'MANUAL',
      config: {},
      enabled: true,
    },
  ],
  variables: {},
  constraints: {
    approvalRequired: false,
  },
  notifications: {
    onStart: false,
    onComplete: true,
    onError: true,
    onApprovalNeeded: true,
    channels: [],
  },
};

type NodeType = 'trigger' | 'action' | 'condition' | 'approval';

const stepTypeToNodeType = (stepType: WorkflowStep['type']): NodeType => {
  switch (stepType) {
    case 'TRIGGER':
      return 'trigger';
    case 'ACTION':
      return 'action';
    case 'CONDITION':
      return 'condition';
    case 'APPROVAL':
      return 'approval';
    default:
      return 'action';
  }
};

const nodeTypes: Record<NodeType, React.FC<Node<WorkflowStepNodeData>>> = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  approval: ApprovalNode,
};

interface BuilderState {
  agentName: string;
  description: string;
  type: Agent['type'];
  configuration: AgentConfiguration;
  isDirty: boolean;
}

const createStepDisplayName = (stepType: WorkflowStep['type']) => {
  const tool = BUILDER_TOOL_DEFINITIONS.find((definition) => definition.stepType === stepType);
  if (tool) {
    return tool.name;
  }
  const formatted = stepType.charAt(0) + stepType.slice(1).toLowerCase();
  return `${formatted} step`;
};

const createEdgeId = (sourceId: string, handle: string | null | undefined, targetId: string) =>
  `${sourceId}-${handle ?? 'default'}-${targetId}`;

const mapWorkflowToEdges = (workflow: WorkflowStep[]): Edge[] => {
  const edges: Edge[] = [];

  workflow.forEach((step) => {
    if (step.connections.success) {
      edges.push({
        id: createEdgeId(step.id, 'success', step.connections.success),
        source: step.id,
        target: step.connections.success,
        sourceHandle: 'success',
        targetHandle: 'input',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#22c55e' },
        label: 'Success',
      });
    }

    if (step.connections.failure) {
      edges.push({
        id: createEdgeId(step.id, 'failure', step.connections.failure),
        source: step.id,
        target: step.connections.failure,
        sourceHandle: 'failure',
        targetHandle: 'input',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#ef4444' },
        label: 'Failure',
      });
    }

    step.connections.conditions?.forEach((condition, index) => {
      if (!condition.nextStepId) {
        return;
      }
      edges.push({
        id: createEdgeId(step.id, `condition-${index}`, condition.nextStepId),
        source: step.id,
        target: condition.nextStepId,
        sourceHandle: `condition-${index}`,
        targetHandle: 'input',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#f59e0b' },
        label: condition.condition,
      });
    });
  });

  return edges;
};

const AgentBuilderCanvas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const reactFlowInstance = useReactFlow();

  const isEditing = Boolean(id);

  const [builderState, setBuilderState] = useState<BuilderState>({
    agentName: '',
    description: '',
    type: 'PAYMENT',
    configuration: DEFAULT_CONFIGURATION,
    isDirty: false,
  });
  const [activePanel, setActivePanel] = useState<BuilderPanel>('tools');
  const [showStepConfig, setShowStepConfig] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [nodes, setNodes, _onNodesChange] = useNodesState<WorkflowStepNodeData>([]);
  const [edges, setEdges, _onEdgesChange] = useEdgesState([]);

  const builderStateRef = useRef(builderState);
  useEffect(() => {
    builderStateRef.current = builderState;
  }, [builderState]);

  const { data: agentResponse, isLoading: agentLoading } = useAgent(id ?? '');
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();

  const selectedStep = useMemo(
    () =>
      builderState.configuration.workflow.find((step) => step.id === selectedStepId) ?? null,
    [builderState.configuration.workflow, selectedStepId]
  );

  const handleOpenStepConfig = useCallback((stepId: string) => {
    setSelectedStepId(stepId);
    setShowStepConfig(true);
  }, []);

  const handleDeleteStep = useCallback(
    (stepId: string) => {
      setBuilderState((previous) => {
        const filteredWorkflow = previous.configuration.workflow.filter((step) => step.id !== stepId);

        const cleanedWorkflow = filteredWorkflow.map((step) => {
          const connections = { ...step.connections };
          let changed = false;

          if (connections.success === stepId) {
            delete connections.success;
            changed = true;
          }
          if (connections.failure === stepId) {
            delete connections.failure;
            changed = true;
          }
          if (connections.conditions) {
            connections.conditions = connections.conditions.map((condition) =>
              condition.nextStepId === stepId
                ? { ...condition, nextStepId: undefined }
                : condition
            );
            changed = true;
          }

          return changed
            ? {
                ...step,
                connections,
              }
            : step;
        });

        return {
          ...previous,
          configuration: {
            ...previous.configuration,
            workflow: cleanedWorkflow,
          },
          isDirty: true,
        };
      });

      setNodes((current) => current.filter((node) => node.id !== stepId));
      setEdges((current) => current.filter((edge) => edge.source !== stepId && edge.target !== stepId));

      setSelectedStepId((current) => {
        if (current === stepId) {
          setShowStepConfig(false);
          return null;
        }
        return current;
      });
    },
    [setEdges, setNodes]
  );

  const createNode = useCallback(
    (step: WorkflowStep): Node<WorkflowStepNodeData> => ({
      id: step.id,
      type: stepTypeToNodeType(step.type),
      position: step.position ?? { x: 200, y: 200 },
      data: {
        step,
        onEdit: handleOpenStepConfig,
        onDelete: handleDeleteStep,
      },
    }),
    [handleDeleteStep, handleOpenStepConfig]
  );

  const syncFlowWithWorkflow = useCallback(
    (workflow: WorkflowStep[]) => {
      setNodes(workflow.map((step) => createNode(step)));
      setEdges(mapWorkflowToEdges(workflow));
    },
    [createNode, setEdges, setNodes]
  );

  const loadAgentConfiguration = useCallback(
    (agent?: Agent) => {
      if (!agent) {
        return;
      }
      const configuration = agent.configuration ?? DEFAULT_CONFIGURATION;

      setBuilderState({
        agentName: agent.name,
        description: agent.description ?? '',
        type: agent.type,
        configuration,
        isDirty: false,
      });
      syncFlowWithWorkflow(configuration.workflow);
    },
    [syncFlowWithWorkflow]
  );

  useEffect(() => {
    if (isEditing && agentResponse?.data) {
      loadAgentConfiguration(agentResponse.data);
    }
  }, [agentResponse, isEditing, loadAgentConfiguration]);

  useEffect(() => {
    if (isEditing) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const draft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!draft) {
      return;
    }
    try {
      const parsed: BuilderState = JSON.parse(draft);
      setBuilderState({
        ...parsed,
        isDirty: false,
      });
      syncFlowWithWorkflow(parsed.configuration.workflow);
    } catch (error) {
      console.error('Failed to load agent builder draft', error);
    }
  }, [isEditing, syncFlowWithWorkflow]);

  useEffect(() => {
    if (isEditing) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          agentName: builderState.agentName,
          description: builderState.description,
          type: builderState.type,
          configuration: builderState.configuration,
          isDirty: builderState.isDirty,
        })
      );
    } catch (error) {
      console.error('Failed to persist agent builder draft', error);
    }
  }, [builderState, isEditing]);

  useEffect(() => {
    if (nodes.length === 0) {
      return;
    }
    reactFlowInstance.fitView({ padding: 0.2, duration: 250 });
  }, [nodes, reactFlowInstance]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((current) => {
        const updatedNodes = applyNodeChanges(changes, current);
        const positionChanges = changes.filter(
          (change) => change.type === 'position' && change.position
        );

        if (positionChanges.length > 0) {
          setBuilderState((previous) => {
            const updatedWorkflow = previous.configuration.workflow.map((step) => {
              const change = positionChanges.find((item) => item.id === step.id);
              if (change?.position) {
                return {
                  ...step,
                  position: change.position,
                };
              }
              return step;
            });

            return {
              ...previous,
              configuration: {
                ...previous.configuration,
                workflow: updatedWorkflow,
              },
              isDirty: true,
            };
          });
        }

        return updatedNodes;
      });
    },
    [setNodes]
  );

  const handleRemoveEdgeReferences = useCallback((removedEdges: Edge[]) => {
    if (removedEdges.length === 0) {
      return;
    }

    const affectedStepIds = new Set<string>();
    removedEdges.forEach((edge) => affectedStepIds.add(edge.source));

    let nextWorkflow: WorkflowStep[] | null = null;

    setBuilderState((previous) => {
      const workflow = previous.configuration.workflow.map((step) => {
        if (!affectedStepIds.has(step.id)) {
          return step;
        }

        const connections = { ...step.connections };
        let changed = false;

        removedEdges.forEach((edge) => {
          if (edge.source !== step.id) {
            return;
          }
          if (edge.sourceHandle === 'success' && connections.success === edge.target) {
            delete connections.success;
            changed = true;
          }
          if (edge.sourceHandle === 'failure' && connections.failure === edge.target) {
            delete connections.failure;
            changed = true;
          }
          if (edge.sourceHandle?.startsWith('condition-') && connections.conditions) {
            const index = Number(edge.sourceHandle.split('-')[1]);
            if (Number.isFinite(index) && connections.conditions[index]) {
              connections.conditions = connections.conditions.map((condition, conditionIndex) =>
                conditionIndex === index
                  ? { ...condition, nextStepId: condition.nextStepId === edge.target ? undefined : condition.nextStepId }
                  : condition
              );
              changed = true;
            }
          }
        });

        return changed ? { ...step, connections } : step;
      });

      nextWorkflow = workflow;

      return {
        ...previous,
        configuration: {
          ...previous.configuration,
          workflow,
        },
        isDirty: true,
      };
    });

    if (nextWorkflow) {
      setNodes((current) =>
        current.map((node) =>
          affectedStepIds.has(node.id)
            ? {
                ...node,
                data: {
                  ...node.data,
                  step: nextWorkflow!.find((step) => step.id === node.id) ?? node.data.step,
                },
              }
            : node
        )
      );
    }
  }, [setNodes, setBuilderState]);

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((current) => {
        const removedEdges = changes
          .filter((change) => change.type === 'remove')
          .map((change) => current.find((edge) => edge.id === change.id))
          .filter(Boolean) as Edge[];

        if (removedEdges.length > 0) {
          handleRemoveEdgeReferences(removedEdges);
        }

        return applyEdgeChanges(changes, current);
      });
    },
    [handleRemoveEdgeReferences, setEdges]
  );

  const handleAddStep = useCallback(
    (stepType: WorkflowStep['type'], toolType: string, position?: { x: number; y: number }) => {
      const stepPosition = position ?? {
        x: 200 + nodes.length * 40,
        y: 150 + nodes.length * 24,
      };

      const newStep: WorkflowStep = {
        id: generateId('step'),
        type: stepType,
        name: createStepDisplayName(stepType),
        toolType,
        description: undefined,
        position: stepPosition,
        parameters: {},
        connections: {},
        errorHandling: {
          strategy: 'STOP',
          maxRetries: 3,
        },
        timeout: 30000,
      };

      setBuilderState((previous) => ({
        ...previous,
        configuration: {
          ...previous.configuration,
          workflow: [...previous.configuration.workflow, newStep],
        },
        isDirty: true,
      }));

      setNodes((current) => [...current, createNode(newStep)]);
      setSelectedStepId(newStep.id);
      setShowStepConfig(true);
    },
    [createNode, nodes.length]
  );

  const handleUpdateStep = useCallback((updatedStep: WorkflowStep) => {
    setBuilderState((previous) => ({
      ...previous,
      configuration: {
        ...previous.configuration,
        workflow: previous.configuration.workflow.map((step) =>
          step.id === updatedStep.id ? updatedStep : step
        ),
      },
      isDirty: true,
    }));

    setNodes((current) =>
      current.map((node) =>
        node.id === updatedStep.id
          ? {
              ...node,
              data: {
                ...node.data,
                step: updatedStep,
              },
            }
          : node
      )
    );

    setShowStepConfig(false);
    setSelectedStepId(null);
  }, [setNodes, setBuilderState]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle) {
        return;
      }

      let updatedSourceStep: WorkflowStep | null = null;

      setBuilderState((previous) => {
        const workflow = previous.configuration.workflow.map((step) => {
          if (step.id !== connection.source) {
            return step;
          }

          const connections = { ...step.connections };

          if (connection.sourceHandle === 'success') {
            connections.success = connection.target;
          } else if (connection.sourceHandle === 'failure') {
            connections.failure = connection.target;
          } else if (connection.sourceHandle.startsWith('condition-')) {
            const index = Number(connection.sourceHandle.split('-')[1]);
            const conditions = [...(connections.conditions ?? [])];
            while (conditions.length <= index) {
              conditions.push({
                condition: `Condition ${conditions.length + 1}`,
                nextStepId: undefined,
              });
            }
            conditions[index] = {
              ...conditions[index],
              nextStepId: connection.target,
            };
            connections.conditions = conditions;
          }

          updatedSourceStep = {
            ...step,
            connections,
          };

          return updatedSourceStep;
        });

        return {
          ...previous,
          configuration: {
            ...previous.configuration,
            workflow,
          },
          isDirty: true,
        };
      });

      if (!updatedSourceStep) {
        return;
      }

      setNodes((current) =>
        current.map((node) =>
          node.id === updatedSourceStep!.id
            ? {
                ...node,
                data: {
                  ...node.data,
                  step: updatedSourceStep!,
                },
              }
            : node
        )
      );

      setEdges((current) => {
        const withoutExisting = current.filter(
          (edge) =>
            !(
              edge.source === connection.source &&
              edge.sourceHandle === connection.sourceHandle
            )
        );

        let label = '';
        let stroke = '#38bdf8';

        if (connection.sourceHandle === 'success') {
          label = 'Success';
          stroke = '#22c55e';
        } else if (connection.sourceHandle === 'failure') {
          label = 'Failure';
          stroke = '#ef4444';
        } else if (connection.sourceHandle.startsWith('condition-')) {
          const index = Number(connection.sourceHandle.split('-')[1]);
          label =
            updatedSourceStep?.connections.conditions?.[index]?.condition ?? 'Condition';
          stroke = '#f59e0b';
        }

        const newEdge: Edge = {
          id: createEdgeId(connection.source!, connection.sourceHandle, connection.target!),
          source: connection.source!,
          target: connection.target!,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke },
          label,
        };

        return addEdge(newEdge, withoutExisting);
      });
    },
    [setBuilderState, setEdges, setNodes]
  );

  const handleConstraintsUpdate = useCallback((constraints: AgentConfiguration['constraints']) => {
    setBuilderState((previous) => ({
      ...previous,
      configuration: {
        ...previous.configuration,
        constraints,
      },
      isDirty: true,
    }));
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const data = event.dataTransfer.getData('application/reactflow');
      if (!data) {
        return;
      }

      try {
        const parsed = JSON.parse(data) as { stepType: WorkflowStep['type']; toolId: string };
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (!bounds) {
          return;
        }
        const position = reactFlowInstance.project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
        handleAddStep(parsed.stepType, parsed.toolId, position);
      } catch (error) {
        console.error('Failed to parse dropped tool payload', error);
      }
    },
    [handleAddStep, reactFlowInstance]
  );

  const validationIssues = useMemo(() => {
    const issues: string[] = [];

    if (!builderState.agentName.trim()) {
      issues.push('Agent name is required.');
    }

    if (builderState.configuration.workflow.length === 0) {
      issues.push('Add at least one workflow step.');
    }

    const triggerCount = builderState.configuration.workflow.filter((step) => step.type === 'TRIGGER')
      .length;
    if (triggerCount === 0) {
      issues.push('Add at least one trigger to start the workflow.');
    }

    builderState.configuration.workflow.forEach((step) => {
      if (!step.toolType) {
        issues.push(`${step.name} requires a tool selection.`);
      }
    });

    return issues;
  }, [builderState.agentName, builderState.configuration.workflow]);

  const handleSave = useCallback(async () => {
    if (!builderState.agentName.trim()) {
      toast.error('Agent name is required.');
      return;
    }

    if (builderState.configuration.workflow.length === 0) {
      toast.error('Add at least one workflow step.');
      return;
    }

    const hasTrigger = builderState.configuration.workflow.some((step) => step.type === 'TRIGGER');
    if (!hasTrigger) {
      toast.error('Workflow must contain at least one trigger.');
      return;
    }

    const payload: CreateAgentData = {
      name: builderState.agentName.trim(),
      description: builderState.description.trim(),
      type: builderState.type,
      configuration: builderState.configuration,
      metadata: {
        tags: [],
        category: 'Custom',
        priority: 'MEDIUM',
        environment: 'SANDBOX',
      },
    };

    try {
      setIsValidating(true);

      if (isEditing && id) {
        await updateAgentMutation.mutateAsync({ id, data: payload });
        setBuilderState((previous) => ({ ...previous, isDirty: false }));
      } else {
        await createAgentMutation.mutateAsync(payload);
        setBuilderState((previous) => ({ ...previous, isDirty: false }));
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
        navigate('/agents');
      }
    } catch (error) {
      console.error('Failed to persist agent', error);
    } finally {
      setIsValidating(false);
    }
  }, [
    builderState,
    createAgentMutation,
    id,
    isEditing,
    navigate,
    updateAgentMutation,
  ]);

  const handleDiscard = useCallback(() => {
    if (builderState.isDirty) {
      const confirmed = window.confirm('Discard unsaved changes?');
      if (!confirmed) {
        return;
      }
    }

    if (isEditing && agentResponse?.data) {
      loadAgentConfiguration(agentResponse.data);
      setSelectedStepId(null);
      setShowStepConfig(false);
      return;
    }

    setBuilderState({
      agentName: '',
      description: '',
      type: 'PAYMENT',
      configuration: DEFAULT_CONFIGURATION,
      isDirty: false,
    });
    setNodes([]);
    setEdges([]);
    setSelectedStepId(null);
    setShowStepConfig(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [agentResponse?.data, builderState.isDirty, isEditing, loadAgentConfiguration, setEdges, setNodes]);

  const canRunTest = Boolean(isEditing && !builderState.isDirty && builderState.configuration.workflow.length > 0);

  const handleTestClick = useCallback(() => {
    setActivePanel('testing');
  }, []);

  if (agentLoading && isEditing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Helmet>
        <title>Agent builder | AgentPay Hub</title>
      </Helmet>

      <AgentBuilderHeader
        agentName={builderState.agentName}
        description={builderState.description}
        type={builderState.type}
        isDirty={builderState.isDirty}
        isValidating={isValidating}
        onNameChange={(name) =>
          setBuilderState((previous) => ({
            ...previous,
            agentName: name,
            isDirty: true,
          }))
        }
        onDescriptionChange={(description) =>
          setBuilderState((previous) => ({
            ...previous,
            description,
            isDirty: true,
          }))
        }
        onTypeChange={(type) =>
          setBuilderState((previous) => ({
            ...previous,
            type,
            isDirty: true,
          }))
        }
        onSave={handleSave}
        onDiscard={handleDiscard}
        validationIssues={validationIssues}
        canRunTest={canRunTest}
        onTest={handleTestClick}
      />

      <div className="flex flex-1 overflow-hidden">
        <AgentBuilderSidebar
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          onAddStep={handleAddStep}
          configuration={builderState.configuration}
        />

        <div className="relative flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <Background color="#e2e8f0" gap={24} />
          </ReactFlow>
        </div>

        <aside className="w-80 border-l border-gray-200 bg-white">
          {activePanel === 'constraints' && (
            <ConstraintsPanel
              constraints={builderState.configuration.constraints}
              onUpdate={handleConstraintsUpdate}
            />
          )}

          {activePanel === 'testing' && (
            <TestingPanel configuration={builderState.configuration} agentId={id} />
          )}

          {activePanel === 'tools' && (
            <div className="p-6 text-xs text-gray-500">
              Select a tool from the palette to begin building your workflow. Drag steps onto the canvas
              to arrange the execution order.
            </div>
          )}
        </aside>
      </div>

      {selectedStep && (
        <StepConfigModal
          step={selectedStep}
          isOpen={showStepConfig}
          onClose={() => {
            setShowStepConfig(false);
            setSelectedStepId(null);
          }}
          onSave={handleUpdateStep}
        />
      )}
    </div>
  );
};

const AgentBuilderPage: React.FC = () => (
  <ReactFlowProvider>
    <AgentBuilderCanvas />
  </ReactFlowProvider>
);

export default AgentBuilderPage;
