import { IWorkflowStep } from '../../models/Agent.js';
import { logger } from '../../config/logger.js';
import { CustomError } from '../../middleware/errorHandler.js';

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ExecutionPath {
  stepId: string;
  conditions?: Array<{
    condition: string;
    nextStepId: string;
    probability?: number;
  }>;
  defaultNext?: string;
}

export interface WorkflowMetrics {
  totalSteps: number;
  triggerSteps: number;
  actionSteps: number;
  conditionSteps: number;
  approvalSteps: number;
  complexity: number;
  estimatedDuration: number;
  estimatedCost: number;
}

class WorkflowEngine {
  /**
   * Validate workflow configuration
   */
  validateWorkflow(workflow: IWorkflowStep[]): WorkflowValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    logger.debug('Validating workflow', { stepCount: workflow.length });

    // Basic validation
    if (!workflow || workflow.length === 0) {
      errors.push('Workflow must contain at least one step');
      return { isValid: false, errors, warnings, suggestions };
    }

    // Check for duplicate step IDs
    const stepIds = workflow.map(step => step.id);
    const duplicateIds = stepIds.filter((id, index) => stepIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate step IDs found: ${duplicateIds.join(', ')}`);
    }

    // Validate step structure
    for (const step of workflow) {
      this.validateStep(step, errors, warnings, suggestions);
    }

    // Workflow-level validation
    this.validateWorkflowStructure(workflow, errors, warnings, suggestions);
    this.validateWorkflowConnections(workflow, errors, warnings, suggestions);
    this.validateWorkflowLogic(workflow, errors, warnings, suggestions);

    const isValid = errors.length === 0;

    logger.debug('Workflow validation completed', {
      isValid,
      errorCount: errors.length,
      warningCount: warnings.length,
      suggestionCount: suggestions.length,
    });

    return { isValid, errors, warnings, suggestions };
  }

  /**
   * Get execution order for workflow steps
   */
  getExecutionOrder(workflow: IWorkflowStep[]): IWorkflowStep[] {
    // Find trigger step (starting point)
    const triggerStep = workflow.find(step => step.type === 'TRIGGER');
    if (!triggerStep) {
      throw new CustomError('No trigger step found in workflow', 400, 'NO_TRIGGER_STEP');
    }

    const executionOrder: IWorkflowStep[] = [];
    const visited = new Set<string>();
    
    this.buildExecutionOrder(triggerStep, workflow, executionOrder, visited);

    logger.debug('Execution order determined', {
      totalSteps: workflow.length,
      orderedSteps: executionOrder.length,
      startStep: triggerStep.id,
    });

    return executionOrder;
  }

  /**
   * Get next step based on current step and execution state
   */
  getNextStep(
    currentStep: IWorkflowStep,
    workflow: IWorkflowStep[],
    variables: Record<string, any>
  ): IWorkflowStep | null {
    const connections = currentStep.connections;

    // Check conditional connections first
    if (connections.conditions && connections.conditions.length > 0) {
      for (const condition of connections.conditions) {
        if (this.evaluateCondition(condition.condition, variables)) {
          const nextStep = workflow.find(step => step.id === condition.nextStepId);
          if (nextStep) {
            logger.debug('Next step determined by condition', {
              currentStep: currentStep.id,
              nextStep: nextStep.id,
              condition: condition.condition,
            });
            return nextStep;
          }
        }
      }
    }

    // Check success connection
    if (connections.success) {
      const nextStep = workflow.find(step => step.id === connections.success);
      if (nextStep) {
        logger.debug('Next step determined by success path', {
          currentStep: currentStep.id,
          nextStep: nextStep.id,
        });
        return nextStep;
      }
    }

    logger.debug('No next step found', { currentStep: currentStep.id });
    return null;
  }

  /**
   * Analyze workflow complexity and performance
   */
  analyzeWorkflow(workflow: IWorkflowStep[]): WorkflowMetrics {
    const metrics: WorkflowMetrics = {
      totalSteps: workflow.length,
      triggerSteps: 0,
      actionSteps: 0,
      conditionSteps: 0,
      approvalSteps: 0,
      complexity: 0,
      estimatedDuration: 0,
      estimatedCost: 0,
    };

    // Count step types
    for (const step of workflow) {
      switch (step.type) {
        case 'TRIGGER':
          metrics.triggerSteps++;
          break;
        case 'ACTION':
          metrics.actionSteps++;
          break;
        case 'CONDITION':
          metrics.conditionSteps++;
          break;
        case 'APPROVAL':
          metrics.approvalSteps++;
          break;
      }

      // Calculate complexity based on connections
      const connectionCount = 
        (step.connections.conditions?.length || 0) +
        (step.connections.success ? 1 : 0) +
        (step.connections.failure ? 1 : 0);
      
      metrics.complexity += connectionCount;

      // Estimate duration (in milliseconds)
      const stepDuration = step.timeout || 30000;
      metrics.estimatedDuration += stepDuration;

      // Estimate cost (simplified calculation)
      metrics.estimatedCost += this.estimateStepCost(step);
    }

    // Normalize complexity score
    metrics.complexity = metrics.complexity / Math.max(workflow.length, 1);

    logger.debug('Workflow analysis completed', metrics);

    return metrics;
  }

  /**
   * Optimize workflow for performance
   */
  optimizeWorkflow(workflow: IWorkflowStep[]): {
    optimizedWorkflow: IWorkflowStep[];
    optimizations: string[];
  } {
    const optimizedWorkflow = [...workflow];
    const optimizations: string[] = [];

    // Remove unreachable steps
    const reachableSteps = this.findReachableSteps(optimizedWorkflow);
    const unreachableSteps = optimizedWorkflow.filter(
      step => !reachableSteps.has(step.id)
    );

    if (unreachableSteps.length > 0) {
      unreachableSteps.forEach(step => {
        const index = optimizedWorkflow.findIndex(s => s.id === step.id);
        if (index > -1) {
          optimizedWorkflow.splice(index, 1);
        }
      });
      optimizations.push(
        `Removed ${unreachableSteps.length} unreachable steps: ${unreachableSteps.map(s => s.id).join(', ')}`
      );
    }

    // Optimize timeouts
    for (const step of optimizedWorkflow) {
      if (!step.timeout || step.timeout > 60000) {
        step.timeout = this.calculateOptimalTimeout(step);
        optimizations.push(`Optimized timeout for step ${step.id}`);
      }
    }

    // Merge consecutive condition steps where possible
    this.mergeConditionSteps(optimizedWorkflow, optimizations);

    // Suggest parallel execution opportunities
    this.identifyParallelExecutionOpportunities(optimizedWorkflow, optimizations);

    logger.info('Workflow optimization completed', {
      originalSteps: workflow.length,
      optimizedSteps: optimizedWorkflow.length,
      optimizationCount: optimizations.length,
    });

    return { optimizedWorkflow, optimizations };
  }

  /**
   * Generate workflow execution plan
   */
  generateExecutionPlan(workflow: IWorkflowStep[]): {
    plan: ExecutionPath[];
    estimatedDuration: number;
    riskFactors: string[];
  } {
    const plan: ExecutionPath[] = [];
    const riskFactors: string[] = [];
    let estimatedDuration = 0;

    for (const step of workflow) {
      const executionPath: ExecutionPath = {
        stepId: step.id,
      };

      // Add conditional paths
      if (step.connections.conditions) {
        executionPath.conditions = step.connections.conditions.map(condition => ({
          condition: condition.condition,
          nextStepId: condition.nextStepId,
          probability: this.estimateConditionProbability(condition.condition),
        }));
      }

      // Add default next step
      if (step.connections.success) {
        executionPath.defaultNext = step.connections.success;
      }

      plan.push(executionPath);

      // Add to estimated duration
      estimatedDuration += step.timeout || 30000;

      // Identify risk factors
      if (step.type === 'APPROVAL') {
        riskFactors.push(`Manual approval required at step: ${step.id}`);
      }
      if ((step.timeout || 30000) > 120000) {
        riskFactors.push(`Long-running step detected: ${step.id}`);
      }
      if (step.errorHandling.strategy === 'ROLLBACK') {
        riskFactors.push(`Rollback complexity at step: ${step.id}`);
      }
    }

    logger.debug('Execution plan generated', {
      stepCount: plan.length,
      estimatedDuration,
      riskFactorCount: riskFactors.length,
    });

    return { plan, estimatedDuration, riskFactors };
  }

  /**
   * Validate individual step
   */
  private validateStep(
    step: IWorkflowStep,
    errors: string[],
    warnings: string[],
    suggestions: string[]
  ): void {
    // Required fields
    if (!step.id) {
      errors.push('Step must have an ID');
    }
    if (!step.name) {
      errors.push(`Step ${step.id} must have a name`);
    }
    if (!step.type) {
      errors.push(`Step ${step.id} must have a type`);
    }
    if (!step.toolType) {
      errors.push(`Step ${step.id} must have a toolType`);
    }

    // Position validation
    if (!step.position || typeof step.position.x !== 'number' || typeof step.position.y !== 'number') {
      errors.push(`Step ${step.id} must have valid position coordinates`);
    }

    // Timeout validation
    if (step.timeout && (step.timeout < 1000 || step.timeout > 300000)) {
      warnings.push(`Step ${step.id} timeout should be between 1-300 seconds`);
    }

    // Error handling validation
    if (step.errorHandling.maxRetries && step.errorHandling.maxRetries > 10) {
      warnings.push(`Step ${step.id} has high retry count, consider reducing`);
    }

    // Type-specific validation
    switch (step.type) {
      case 'TRIGGER':
        if (!step.connections.success) {
          errors.push(`Trigger step ${step.id} must have a success connection`);
        }
        break;
      case 'CONDITION':
        if (!step.connections.conditions || step.connections.conditions.length === 0) {
          errors.push(`Condition step ${step.id} must have conditional connections`);
        }
        break;
      case 'APPROVAL':
        if (!step.parameters.approvers) {
          warnings.push(`Approval step ${step.id} should specify approvers`);
        }
        break;
    }

    // Suggestions
    if (!step.description) {
      suggestions.push(`Add description to step ${step.id} for better documentation`);
    }
    if (step.type === 'ACTION' && !step.connections.failure) {
      suggestions.push(`Consider adding failure handling to action step ${step.id}`);
    }
  }

  /**
   * Validate workflow structure
   */
  private validateWorkflowStructure(
    workflow: IWorkflowStep[],
    errors: string[],
    warnings: string[],
    suggestions: string[]
  ): void {
    // Must have exactly one trigger
    const triggers = workflow.filter(step => step.type === 'TRIGGER');
    if (triggers.length === 0) {
      errors.push('Workflow must have exactly one trigger step');
    } else if (triggers.length > 1) {
      errors.push('Workflow cannot have multiple trigger steps');
    }

    // Check for circular dependencies
    if (this.hasCircularDependencies(workflow)) {
      errors.push('Workflow contains circular dependencies');
    }

    // Check for orphaned steps
    const orphanedSteps = this.findOrphanedSteps(workflow);
    if (orphanedSteps.length > 0) {
      warnings.push(`Found orphaned steps: ${orphanedSteps.map(s => s.id).join(', ')}`);
    }

    // Suggest workflow improvements
    const approvalSteps = workflow.filter(step => step.type === 'APPROVAL');
    if (approvalSteps.length > 3) {
      suggestions.push('Consider consolidating approval steps for better user experience');
    }

    const actionSteps = workflow.filter(step => step.type === 'ACTION');
    if (actionSteps.length > 10) {
      suggestions.push('Large workflow detected, consider breaking into smaller workflows');
    }
  }

  /**
   * Validate workflow connections
   */
  private validateWorkflowConnections(
    workflow: IWorkflowStep[],
    errors: string[],
    warnings: string[],
    suggestions: string[]
  ): void {
    const stepIds = new Set(workflow.map(step => step.id));

    for (const step of workflow) {
      // Validate success connection
      if (step.connections.success && !stepIds.has(step.connections.success)) {
        errors.push(`Step ${step.id} has invalid success connection: ${step.connections.success}`);
      }

      // Validate failure connection
      if (step.connections.failure && !stepIds.has(step.connections.failure)) {
        errors.push(`Step ${step.id} has invalid failure connection: ${step.connections.failure}`);
      }

      // Validate conditional connections
      if (step.connections.conditions) {
        for (const condition of step.connections.conditions) {
          if (!stepIds.has(condition.nextStepId)) {
            errors.push(`Step ${step.id} has invalid conditional connection: ${condition.nextStepId}`);
          }
          if (!condition.condition || condition.condition.trim() === '') {
            errors.push(`Step ${step.id} has empty condition expression`);
          }
        }
      }

      // Validate fallback step
      if (step.errorHandling.fallbackStepId && !stepIds.has(step.errorHandling.fallbackStepId)) {
        errors.push(`Step ${step.id} has invalid fallback step: ${step.errorHandling.fallbackStepId}`);
      }
    }
  }

  /**
   * Validate workflow logic
   */
  private validateWorkflowLogic(
    workflow: IWorkflowStep[],
    errors: string[],
    warnings: string[],
    suggestions: string[]
  ): void {
    // Check for dead ends (steps with no outgoing connections)
    const deadEnds = workflow.filter(step => 
      !step.connections.success && 
      !step.connections.failure && 
      (!step.connections.conditions || step.connections.conditions.length === 0)
    );

    if (deadEnds.length > 1) {
      warnings.push(`Multiple dead ends found: ${deadEnds.map(s => s.id).join(', ')}`);
    }

    // Check for unreachable approval steps
    const approvalSteps = workflow.filter(step => step.type === 'APPROVAL');
    for (const approval of approvalSteps) {
      const reachableFromTrigger = this.isStepReachable(workflow, approval.id);
      if (!reachableFromTrigger) {
        warnings.push(`Approval step ${approval.id} may not be reachable from trigger`);
      }
    }

    // Validate condition expressions
    for (const step of workflow) {
      if (step.connections.conditions) {
        for (const condition of step.connections.conditions) {
          try {
            this.validateConditionExpression(condition.condition);
          } catch (error) {
            errors.push(`Invalid condition expression in step ${step.id}: ${condition.condition}`);
          }
        }
      }
    }
  }

  /**
   * Build execution order recursively
   */
  private buildExecutionOrder(
    currentStep: IWorkflowStep,
    workflow: IWorkflowStep[],
    executionOrder: IWorkflowStep[],
    visited: Set<string>
  ): void {
    if (visited.has(currentStep.id)) {
      return; // Avoid infinite loops
    }

    visited.add(currentStep.id);
    executionOrder.push(currentStep);

    // Add next steps based on connections
    const nextStepIds = new Set<string>();

    if (currentStep.connections.success) {
      nextStepIds.add(currentStep.connections.success);
    }
    if (currentStep.connections.failure) {
      nextStepIds.add(currentStep.connections.failure);
    }
    if (currentStep.connections.conditions) {
      currentStep.connections.conditions.forEach(condition => {
        nextStepIds.add(condition.nextStepId);
      });
    }

    // Recursively build order for next steps
    nextStepIds.forEach(stepId => {
      const nextStep = workflow.find(step => step.id === stepId);
      if (nextStep && !visited.has(stepId)) {
        this.buildExecutionOrder(nextStep, workflow, executionOrder, visited);
      }
    });
  }

  /**
   * Check for circular dependencies
   */
  private hasCircularDependencies(workflow: IWorkflowStep[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) {
        return true; // Circular dependency found
      }
      if (visited.has(stepId)) {
        return false;
      }

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = workflow.find(s => s.id === stepId);
      if (step) {
        const nextSteps: string[] = [];
        if (step.connections.success) nextSteps.push(step.connections.success);
        if (step.connections.failure) nextSteps.push(step.connections.failure);
        if (step.connections.conditions) {
          nextSteps.push(...step.connections.conditions.map(c => c.nextStepId));
        }

        for (const nextStepId of nextSteps) {
          if (dfs(nextStepId)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    // Check from each step
    for (const step of workflow) {
      if (!visited.has(step.id)) {
        if (dfs(step.id)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Find orphaned steps (not reachable from trigger)
   */
  private findOrphanedSteps(workflow: IWorkflowStep[]): IWorkflowStep[] {
    const trigger = workflow.find(step => step.type === 'TRIGGER');
    if (!trigger) return [];

    const reachable = this.findReachableSteps(workflow);
    return workflow.filter(step => !reachable.has(step.id));
  }

  /**
   * Find all reachable steps from trigger
   */
  private findReachableSteps(workflow: IWorkflowStep[]): Set<string> {
    const trigger = workflow.find(step => step.type === 'TRIGGER');
    if (!trigger) return new Set();

    const reachable = new Set<string>();
    const queue = [trigger.id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (reachable.has(currentId)) continue;

      reachable.add(currentId);
      const step = workflow.find(s => s.id === currentId);
      
      if (step) {
        if (step.connections.success) queue.push(step.connections.success);
        if (step.connections.failure) queue.push(step.connections.failure);
        if (step.connections.conditions) {
          step.connections.conditions.forEach(condition => {
            queue.push(condition.nextStepId);
          });
        }
      }
    }

    return reachable;
  }

  /**
   * Check if step is reachable from trigger
   */
  private isStepReachable(workflow: IWorkflowStep[], stepId: string): boolean {
    const reachable = this.findReachableSteps(workflow);
    return reachable.has(stepId);
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(expression: string, variables: Record<string, any>): boolean {
    try {
      // Simple expression evaluation
      // In production, use a proper expression evaluator
      let processedExpression = expression;
      
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        const replacement = typeof value === 'string' ? `"${value}"` : String(value);
        processedExpression = processedExpression.replace(regex, replacement);
      }

      const func = new Function(`return ${processedExpression}`);
      return Boolean(func());
    } catch {
      return false;
    }
  }

  /**
   * Validate condition expression syntax
   */
  private validateConditionExpression(expression: string): void {
    // Basic syntax validation
    if (!expression || expression.trim() === '') {
      throw new Error('Empty condition expression');
    }

    // Check for dangerous functions
    const dangerousPatterns = [
      /eval\(/,
      /Function\(/,
      /setTimeout\(/,
      /setInterval\(/,
      /require\(/,
      /import\(/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(expression)) {
        throw new Error('Dangerous function call in condition expression');
      }
    }
  }

  /**
   * Estimate step execution cost
   */
  private estimateStepCost(step: IWorkflowStep): number {
    const baseCost = 0.01; // Base cost per step
    let cost = baseCost;

    // Add cost based on step type
    switch (step.type) {
      case 'TRIGGER':
        cost += 0.005;
        break;
      case 'ACTION':
        cost += 0.02;
        break;
      case 'CONDITION':
        cost += 0.005;
        break;
      case 'APPROVAL':
        cost += 0.01; // Human review cost
        break;
    }

    // Add cost based on timeout (longer steps cost more)
    const timeout = step.timeout || 30000;
    cost += (timeout / 1000) * 0.001;

    return cost;
  }

  /**
   * Calculate optimal timeout for step
   */
  private calculateOptimalTimeout(step: IWorkflowStep): number {
    const baseTimeout = 30000; // 30 seconds

    switch (step.type) {
      case 'TRIGGER':
        return 5000; // 5 seconds
      case 'CONDITION':
        return 10000; // 10 seconds
      case 'APPROVAL':
        return 300000; // 5 minutes for human approval
      case 'ACTION':
        // Determine based on tool type
        if (step.toolType.includes('http') || step.toolType.includes('api')) {
          return 60000; // 1 minute for external API calls
        }
        if (step.toolType.includes('email') || step.toolType.includes('notification')) {
          return 45000; // 45 seconds for notifications
        }
        return baseTimeout;
      default:
        return baseTimeout;
    }
  }

  /**
   * Merge consecutive condition steps
   */
  private mergeConditionSteps(
    workflow: IWorkflowStep[],
    optimizations: string[]
  ): void {
    // Look for consecutive condition steps that can be merged
    // This is a simplified implementation
    const conditionSteps = workflow.filter(step => step.type === 'CONDITION');
    
    if (conditionSteps.length > 1) {
      optimizations.push('Consider merging consecutive condition steps for better performance');
    }
  }

  /**
   * Identify parallel execution opportunities
   */
  private identifyParallelExecutionOpportunities(
    workflow: IWorkflowStep[],
    optimizations: string[]
  ): void {
    // Look for steps that could be executed in parallel
    const actionSteps = workflow.filter(step => step.type === 'ACTION');
    
    for (const step of actionSteps) {
      const dependencies = this.getStepDependencies(step, workflow);
      if (dependencies.length === 0) {
        optimizations.push(`Step ${step.id} could potentially be executed in parallel`);
      }
    }
  }

  /**
   * Get step dependencies
   */
  private getStepDependencies(step: IWorkflowStep, workflow: IWorkflowStep[]): string[] {
    const dependencies: string[] = [];
    
    // Find steps that lead to this step
    for (const otherStep of workflow) {
      if (otherStep.id === step.id) continue;
      
      if (otherStep.connections.success === step.id ||
          otherStep.connections.failure === step.id ||
          otherStep.connections.conditions?.some(c => c.nextStepId === step.id)) {
        dependencies.push(otherStep.id);
      }
    }
    
    return dependencies;
  }

  /**
   * Estimate condition probability
   */
  private estimateConditionProbability(condition: string): number {
    // Simplified probability estimation
    // In production, use historical data or ML models
    
    if (condition.includes('==') || condition.includes('===')) {
      return 0.5; // Equal comparison
    }
    if (condition.includes('>') || condition.includes('<')) {
      return 0.3; // Comparison likely less frequent
    }
    if (condition.includes('includes') || condition.includes('contains')) {
      return 0.4; // String matching
    }
    
    return 0.5; // Default probability
  }
}

export default WorkflowEngine;
