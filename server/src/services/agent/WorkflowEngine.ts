import { IWorkflowStep } from '../../models/Agent.js';
import { CustomError } from '../../middleware/errorHandler.js';

interface WorkflowMap {
  [id: string]: IWorkflowStep;
}

class WorkflowEngine {
  validateWorkflow(workflow: IWorkflowStep[]): void {
    if (!Array.isArray(workflow) || workflow.length === 0) {
      throw new CustomError('Workflow must contain at least one step', 400, 'WORKFLOW_EMPTY');
    }

    const triggerSteps = workflow.filter(step => step.type === 'TRIGGER');
    if (triggerSteps.length !== 1) {
      throw new CustomError('Workflow must contain exactly one trigger step', 400, 'WORKFLOW_TRIGGER_INVALID');
    }

    const ids = new Set<string>();
    for (const step of workflow) {
      if (ids.has(step.id)) {
        throw new CustomError(`Duplicate step id detected: ${step.id}`, 400, 'WORKFLOW_DUPLICATE_STEP');
      }
      ids.add(step.id);
    }
  }

  getExecutionOrder(workflow: IWorkflowStep[]): IWorkflowStep[] {
    const trigger = workflow.find(step => step.type === 'TRIGGER');
    if (!trigger) {
      throw new CustomError('Workflow trigger step missing', 400, 'WORKFLOW_TRIGGER_MISSING');
    }

    const map: WorkflowMap = workflow.reduce((acc, step) => {
      acc[step.id] = step;
      return acc;
    }, {} as WorkflowMap);

    const order: IWorkflowStep[] = [];
    const visited = new Set<string>();

    let current: IWorkflowStep | undefined = trigger;
    while (current && !visited.has(current.id)) {
      order.push(current);
      visited.add(current.id);

      const nextId = current.connections?.success;
      current = nextId ? map[nextId] : undefined;
    }

    // Append any remaining steps that were not reachable from the trigger
    for (const step of workflow) {
      if (!visited.has(step.id)) {
        order.push(step);
      }
    }

    return order;
  }

  getNextStep(
    currentStep: IWorkflowStep,
    workflow: IWorkflowStep[],
    variables: Record<string, any>
  ): IWorkflowStep | null {
    const map: WorkflowMap = workflow.reduce((acc, step) => {
      acc[step.id] = step;
      return acc;
    }, {} as WorkflowMap);

    // Evaluate conditional connections first
    const conditions = currentStep.connections?.conditions;
    if (conditions && conditions.length > 0) {
      for (const condition of conditions) {
        if (this.evaluateCondition(condition.condition, variables)) {
          return map[condition.nextStepId] || null;
        }
      }
      return null;
    }

    if (currentStep.connections?.success) {
      return map[currentStep.connections.success] || null;
    }

    return null;
  }

  private evaluateCondition(expression: string, variables: Record<string, any>): boolean {
    if (!expression) {
      return false;
    }

    let processedExpression = expression;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      const replacement = typeof value === 'string' ? `"${value}"` : String(value);
      processedExpression = processedExpression.replace(regex, replacement);
    }

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return (${processedExpression})`);
      return Boolean(fn());
    } catch {
      return false;
    }
  }
}

export default WorkflowEngine;
