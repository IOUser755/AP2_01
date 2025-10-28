import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { Modal, ModalBody, ModalFooter, ModalHeader } from '@components/common/Modal';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';

import type { WorkflowStep } from '@types/agent';

import { BUILDER_TOOL_DEFINITIONS, getToolsByStepType } from './toolLibrary';

interface StepConfigModalProps {
  step: WorkflowStep;
  isOpen: boolean;
  onClose: () => void;
  onSave: (step: WorkflowStep) => void;
}

interface ErrorHandlingFormState {
  strategy: WorkflowStep['errorHandling']['strategy'];
  maxRetries?: number;
  fallbackStepId?: string;
}

export const StepConfigModal: React.FC<StepConfigModalProps> = ({ step, isOpen, onClose, onSave }) => {
  const [name, setName] = useState(step.name);
  const [description, setDescription] = useState(step.description ?? '');
  const [toolType, setToolType] = useState(step.toolType);
  const [timeout, setTimeout] = useState<number>(step.timeout ?? 30000);
  const [parametersText, setParametersText] = useState(() =>
    JSON.stringify(step.parameters ?? {}, null, 2)
  );
  const [errorHandling, setErrorHandling] = useState<ErrorHandlingFormState>({
    strategy: step.errorHandling.strategy,
    maxRetries: step.errorHandling.maxRetries,
    fallbackStepId: step.errorHandling.fallbackStepId,
  });
  const [conditions, setConditions] = useState(
    step.connections.conditions ?? [
      { condition: 'Condition A', nextStepId: step.connections.success },
      { condition: 'Condition B', nextStepId: step.connections.failure },
    ]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setName(step.name);
    setDescription(step.description ?? '');
    setToolType(step.toolType);
    setTimeout(step.timeout ?? 30000);
    setParametersText(JSON.stringify(step.parameters ?? {}, null, 2));
    setErrorHandling({
      strategy: step.errorHandling.strategy,
      maxRetries: step.errorHandling.maxRetries,
      fallbackStepId: step.errorHandling.fallbackStepId,
    });
    setConditions(
      step.connections.conditions ?? [
        { condition: 'Condition A', nextStepId: step.connections.success },
        { condition: 'Condition B', nextStepId: step.connections.failure },
      ]
    );
  }, [step, isOpen]);

  const availableToolsForStep = useMemo(() => getToolsByStepType(step.type), [step.type]);

  const handleParametersChange = (value: string) => {
    setParametersText(value);
  };

  const handleAddCondition = () => {
    setConditions((prev) => [
      ...prev,
      { condition: `Condition ${String.fromCharCode(65 + prev.length)}`, nextStepId: undefined },
    ]);
  };

  const handleUpdateCondition = (index: number, value: string) => {
    setConditions((prev) =>
      prev.map((condition, conditionIndex) =>
        conditionIndex === index ? { ...condition, condition: value } : condition
      )
    );
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, conditionIndex) => conditionIndex !== index));
  };

  const handleSubmit = () => {
    let parsedParameters: Record<string, unknown> = {};

    try {
      parsedParameters = parametersText.trim() ? JSON.parse(parametersText) : {};
    } catch (error) {
      toast.error('Parameters must be valid JSON.');
      return;
    }

    const updatedStep: WorkflowStep = {
      ...step,
      name: name.trim() || step.name,
      description: description.trim() || undefined,
      toolType,
      timeout,
      parameters: parsedParameters,
      errorHandling: {
        strategy: errorHandling.strategy,
        maxRetries: errorHandling.maxRetries,
        fallbackStepId: errorHandling.fallbackStepId,
      },
      connections: {
        ...step.connections,
      },
    };

    if (step.type === 'CONDITION') {
      updatedStep.connections.conditions = conditions.map((condition, index) => ({
        condition: condition.condition.trim() || `Condition ${index + 1}`,
        nextStepId: condition.nextStepId,
      }));
    }

    onSave(updatedStep);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${step.type} Configuration`} size="lg">
      <ModalHeader className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Configure {step.name}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-5 w-5" />
        </button>
      </ModalHeader>

      <ModalBody className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Step name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tool</label>
            <select
              value={toolType}
              onChange={(event) => setToolType(event.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              {availableToolsForStep.length > 0 ? (
                availableToolsForStep.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name}
                  </option>
                ))
              ) : (
                BUILDER_TOOL_DEFINITIONS.filter((tool) => tool.stepType === step.type).map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <Input
            label="Timeout (ms)"
            type="number"
            min={1000}
            step={1000}
            value={timeout}
            onChange={(event) => setTimeout(Number(event.target.value) || 0)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Parameters (JSON)</label>
          <textarea
            value={parametersText}
            onChange={(event) => handleParametersChange(event.target.value)}
            className="w-full h-40 rounded-md border border-gray-300 font-mono text-xs p-3 focus:border-primary-500 focus:ring-primary-500"
            spellCheck={false}
          />
          <p className="mt-1 text-xs text-gray-500">
            Provide configuration values passed to the tool at runtime.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Error strategy</label>
            <select
              value={errorHandling.strategy}
              onChange={(event) =>
                setErrorHandling((prev) => ({ ...prev, strategy: event.target.value as ErrorHandlingFormState['strategy'] }))
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="STOP">Stop</option>
              <option value="CONTINUE">Continue</option>
              <option value="RETRY">Retry</option>
              <option value="ROLLBACK">Rollback</option>
            </select>
          </div>

          <Input
            label="Max retries"
            type="number"
            min={0}
            value={errorHandling.maxRetries ?? 0}
            onChange={(event) =>
              setErrorHandling((prev) => ({ ...prev, maxRetries: Number(event.target.value) || 0 }))
            }
          />

          <Input
            label="Fallback step ID"
            value={errorHandling.fallbackStepId ?? ''}
            onChange={(event) =>
              setErrorHandling((prev) => ({ ...prev, fallbackStepId: event.target.value || undefined }))
            }
          />
        </div>

        {step.type === 'CONDITION' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Conditional branches</h4>
              <Button variant="outline" size="sm" onClick={handleAddCondition}>
                Add branch
              </Button>
            </div>

            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div
                  key={`condition-${index}`}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Condition {index + 1}</span>
                    {conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(index)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <Input
                    value={condition.condition}
                    onChange={(event) => handleUpdateCondition(index, event.target.value)}
                    placeholder="Expression (e.g., cart.total > 100)"
                  />
                  <p className="text-[11px] text-gray-500">
                    Connect this branch to a step by linking its condition handle on the canvas.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save step</Button>
      </ModalFooter>
    </Modal>
  );
};
