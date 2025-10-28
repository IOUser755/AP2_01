import React, { useMemo } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

import type { AgentConfiguration, WorkflowStep } from '@types/agent';

import {
  BUILDER_TABS,
  BUILDER_TOOL_DEFINITIONS,
  TOOL_CATEGORY_METADATA,
  type BuilderPanel,
  type BuilderToolDefinition,
} from './toolLibrary';

interface AgentBuilderSidebarProps {
  activePanel: BuilderPanel;
  onPanelChange: (panel: BuilderPanel) => void;
  onAddStep: (stepType: WorkflowStep['type'], toolType: string, position?: { x: number; y: number }) => void;
  configuration: AgentConfiguration;
}

const TOOL_SUMMARY_LABELS: Record<WorkflowStep['type'], string> = {
  TRIGGER: 'Triggers',
  ACTION: 'Actions',
  CONDITION: 'Conditions',
  APPROVAL: 'Approvals',
};

const summarizeWorkflow = (configuration: AgentConfiguration) =>
  configuration.workflow.reduce(
    (accumulator, step) => ({
      ...accumulator,
      [step.type]: (accumulator[step.type] ?? 0) + 1,
    }),
    {} as Partial<Record<WorkflowStep['type'], number>>
  );

const getToolColor = (tool: BuilderToolDefinition) => tool.color;

export const AgentBuilderSidebar: React.FC<AgentBuilderSidebarProps> = ({
  activePanel,
  onPanelChange,
  onAddStep,
  configuration,
}) => {
  const workflowSummary = useMemo(() => summarizeWorkflow(configuration), [configuration]);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, tool: BuilderToolDefinition) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ stepType: tool.stepType, toolId: tool.id })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleKeyboardSelect = (
    event: React.KeyboardEvent<HTMLDivElement>,
    tool: BuilderToolDefinition
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onAddStep(tool.stepType, tool.id);
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex border-b border-gray-200">
        {BUILDER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onPanelChange(tab.id)}
            className={clsx(
              'flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activePanel === tab.id
                ? 'border-primary-500 text-primary-600 bg-primary-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <div className="flex items-center justify-center space-x-1">
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activePanel === 'tools' && (
          <div className="p-4 space-y-6">
            <section className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Workflow tools</h3>
                <p className="text-sm text-gray-500">
                  Click to place a step or drag the tool onto the canvas to position it manually.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                {Object.entries(TOOL_SUMMARY_LABELS).map(([type, label]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="text-gray-900 font-semibold">
                      {workflowSummary[type as WorkflowStep['type']] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {Object.entries(TOOL_CATEGORY_METADATA).map(([categoryId, metadata]) => (
              <section key={categoryId} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <metadata.icon className="h-5 w-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{metadata.name}</h4>
                    <p className="text-xs text-gray-500">{metadata.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {BUILDER_TOOL_DEFINITIONS.filter((tool) => tool.category === categoryId).map(
                    (tool) => (
                      <div
                        key={tool.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(event) => handleDragStart(event, tool)}
                        onClick={() => onAddStep(tool.stepType, tool.id)}
                        onKeyDown={(event) => handleKeyboardSelect(event, tool)}
                        className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-grab group focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={clsx('p-2 rounded-lg', getToolColor(tool))}>
                            <tool.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                                {tool.name}
                              </h5>
                              <PlusIcon className="h-4 w-4 text-gray-400 group-hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{tool.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
        )}

        {activePanel === 'constraints' && (
          <div className="p-4 text-sm text-gray-500">
            Use the Constraints panel on the right to enable approvals, budget guardrails, execution
            windows, and regional restrictions.
          </div>
        )}

        {activePanel === 'testing' && (
          <div className="p-4 text-sm text-gray-500">
            Configure sandbox payloads and trigger a dry run from the Testing panel on the right.
            Saved agents can be executed instantly to validate the workflow.
          </div>
        )}
      </div>
    </div>
  );
};
