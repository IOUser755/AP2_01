import React, { useEffect, useMemo, useState } from 'react';
import type { Node } from 'reactflow';
import { TrashIcon } from '@heroicons/react/24/outline';

import { Badge } from '@components/common/Badge';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';

interface NodePropertyPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, updates: Record<string, unknown>) => void;
  onDeleteNode?: (nodeId: string) => void;
  readonly?: boolean;
}

type NodeTypeCopy = {
  title: string;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray';
  description: string;
};

const nodeTypeCopy: Record<string, NodeTypeCopy> = {
  trigger: {
    title: 'Trigger',
    variant: 'success',
    description: 'Define how the workflow is kicked off and what metadata is captured.',
  },
  action: {
    title: 'Action',
    variant: 'primary',
    description: 'Configure which tool runs at this step and which parameters it needs.',
  },
  condition: {
    title: 'Condition',
    variant: 'warning',
    description: 'Use expressions to control routing based on data or execution context.',
  },
  output: {
    title: 'Output',
    variant: 'secondary',
    description: 'Decide how results are formatted and sent to downstream systems.',
  },
};

export const NodePropertyPanel: React.FC<NodePropertyPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  readonly = false,
}) => {
  const [parametersDraft, setParametersDraft] = useState('');
  const [parametersError, setParametersError] = useState<string | null>(null);
  const [templateDraft, setTemplateDraft] = useState('');

  useEffect(() => {
    if (!selectedNode) {
      setParametersDraft('');
      setTemplateDraft('');
      setParametersError(null);
      return;
    }

    const data = (selectedNode.data ?? {}) as Record<string, unknown>;
    const parameters = (data.parameters as Record<string, unknown> | undefined) ?? {};
    const template = typeof data.template === 'string' ? data.template : '';

    setParametersDraft(JSON.stringify(parameters, null, 2));
    setTemplateDraft(template);
    setParametersError(null);
  }, [selectedNode]);

  const meta = useMemo<NodeTypeCopy>(() => {
    if (!selectedNode) {
      return {
        title: 'No node selected',
        variant: 'gray',
        description: 'Select a node on the canvas to edit its configuration.',
      };
    }
    return nodeTypeCopy[selectedNode.type] ?? {
      title: selectedNode.type,
      variant: 'gray',
      description: 'Adjust the properties of this node to match your workflow requirements.',
    };
  }, [selectedNode]);

  const handleUpdate = (updates: Record<string, unknown>) => {
    if (!selectedNode) {
      return;
    }
    onUpdateNode(selectedNode.id, updates);
  };

  const disabled = readonly || !selectedNode;

  const handleParametersBlur = () => {
    if (!selectedNode) {
      return;
    }
    try {
      const parsed = parametersDraft.trim() ? JSON.parse(parametersDraft) : {};
      handleUpdate({ parameters: parsed });
      setParametersError(null);
    } catch (error) {
      setParametersError('Parameters must be valid JSON.');
    }
  };

  const handleTemplateBlur = () => {
    if (!selectedNode) {
      return;
    }
    handleUpdate({ template: templateDraft });
  };

  if (!selectedNode) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
        Select a node to see contextual configuration options.
      </div>
    );
  }

  const data = (selectedNode.data ?? {}) as Record<string, unknown>;
  const label = (data.label as string) ?? '';
  const triggerType = (data.triggerType as string) ?? 'manual';
  const expression = (data.expression as string) ?? '';
  const trueLabel = (data.trueLabel as string) ?? '';
  const falseLabel = (data.falseLabel as string) ?? '';
  const format = (data.format as string) ?? 'json';

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant={meta.variant} size="sm" className="uppercase tracking-wide">
            {meta.title}
          </Badge>
          {onDeleteNode && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => onDeleteNode(selectedNode.id)}
              disabled={readonly}
              leftIcon={<TrashIcon className="h-4 w-4" aria-hidden="true" />}
            >
              Remove node
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500">{meta.description}</p>
      </div>

      <Input
        label="Display label"
        value={label}
        onChange={event => handleUpdate({ label: event.target.value })}
        disabled={disabled}
        placeholder="e.g. Capture payment"
      />

      {selectedNode.type === 'trigger' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Trigger type</label>
          <select
            value={triggerType}
            onChange={event => handleUpdate({ triggerType: event.target.value })}
            disabled={disabled}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="manual">Manual</option>
            <option value="schedule">Schedule</option>
            <option value="webhook">Webhook</option>
            <option value="event">Event</option>
          </select>
        </div>
      )}

      {selectedNode.type === 'condition' && (
        <div className="space-y-4">
          <Input
            label="Condition expression"
            value={expression}
            onChange={event => handleUpdate({ expression: event.target.value })}
            disabled={disabled}
            placeholder="order.total > 0"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="True branch label"
              value={trueLabel}
              onChange={event => handleUpdate({ trueLabel: event.target.value })}
              disabled={disabled}
              placeholder="Continue"
            />
            <Input
              label="False branch label"
              value={falseLabel}
              onChange={event => handleUpdate({ falseLabel: event.target.value })}
              disabled={disabled}
              placeholder="Fallback"
            />
          </div>
        </div>
      )}

      {selectedNode.type === 'output' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Output format</label>
            <select
              value={format}
              onChange={event => handleUpdate({ format: event.target.value })}
              disabled={disabled}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="json">JSON response</option>
              <option value="webhook">Webhook</option>
              <option value="notification">Notification</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Template</label>
            <textarea
              value={templateDraft}
              onChange={event => setTemplateDraft(event.target.value)}
              onBlur={handleTemplateBlur}
              disabled={disabled}
              rows={5}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:cursor-not-allowed disabled:bg-gray-100"
              placeholder='{"status":"success"}'
            />
          </div>
        </div>
      )}

      {selectedNode.type === 'action' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Parameters (JSON)</label>
          <textarea
            value={parametersDraft}
            onChange={event => setParametersDraft(event.target.value)}
            onBlur={handleParametersBlur}
            disabled={disabled}
            rows={6}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:cursor-not-allowed disabled:bg-gray-100"
            placeholder="{\n  \"amount\": 100,\n  \"currency\": \"USD\"\n}"
          />
          {parametersError && <p className="text-xs text-error-600">{parametersError}</p>}
        </div>
      )}
    </div>
  );
};

export default NodePropertyPanel;
