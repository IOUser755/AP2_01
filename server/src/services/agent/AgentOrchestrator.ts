import { Types } from 'mongoose';
import { Agent, IAgent, IWorkflowStep } from '../../models/Agent.js';
import { User, IUser } from '../../models/User.js';
import { logger } from '../../config/logger.js';
import { CustomError } from '../../middleware/errorHandler.js';
import ToolRegistry from './ToolRegistry.js';
import WorkflowEngine from './WorkflowEngine.js';
import server from '../../server.js';

export interface ExecutionContext {
  agentId: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  executionId: string;
  sessionId?: string;
  variables: Record<string, any>;
  metadata: Record<string, any>;
}

export interface StepResult {
  stepId: string;
  status: 'SUCCESS' | 'FAILURE' | 'SKIPPED';
  output: any;
  duration: number;
  error?: Error;
  timestamp: Date;
}

export interface ExecutionResult {
  executionId: string;
  agentId: Types.ObjectId;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';
  steps: StepResult[];
  variables: Record<string, any>;
  duration: number;
  startTime: Date;
  endTime: Date;
  error?: Error;
  metrics: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    skippedSteps: number;
  };
}

class AgentOrchestrator {
  private toolRegistry: ToolRegistry;
  private workflowEngine: WorkflowEngine;
  private runningExecutions: Map<string, Promise<ExecutionResult>>;

  constructor() {
    this.toolRegistry = new ToolRegistry();
    this.workflowEngine = new WorkflowEngine();
    this.runningExecutions = new Map();
  }

  /**
   * Execute an agent workflow
   */
  async executeAgent(
    agentId: Types.ObjectId,
    context: Partial<ExecutionContext>,
    variables: Record<string, any> = {}
  ): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();
    const startTime = new Date();

    logger.agent('Execution started', {
      agentId: agentId.toString(),
      executionId,
      tenantId: context.tenantId?.toString(),
      userId: context.userId?.toString(),
    });

    try {
      // Load agent
      const agent = await Agent.findById(agentId);
      if (!agent) {
        throw new CustomError('Agent not found', 404, 'AGENT_NOT_FOUND');
      }

      // Check if agent can execute
      if (!agent.canExecute()) {
        throw new CustomError(
          `Agent cannot execute. Status: ${agent.status}`,
          400,
          'AGENT_NOT_EXECUTABLE'
        );
      }

      const userId = context.userId || agent.createdBy;
      const user: IUser | null = await User.findById(userId);

      if (!user) {
        throw new CustomError('User not found', 404, 'EXECUTION_USER_NOT_FOUND');
      }

      // Create execution context
      const executionContext: ExecutionContext = {
        agentId,
        tenantId: context.tenantId || agent.tenantId,
        userId,
        executionId,
        sessionId: context.sessionId,
        variables: { ...agent.configuration.variables, ...variables },
        metadata: {
          agentName: agent.name,
          agentType: agent.type,
          agentVersion: agent.version,
          userRole: user.role,
          ...context.metadata,
        },
      };

      // Emit execution start event
      this.emitExecutionEvent('execution:started', executionContext, {
        agent: {
          id: agent._id,
          name: agent.name,
          type: agent.type,
        },
      });

      // Start execution
      const executionPromise = this.executeWorkflow(agent, executionContext);
      this.runningExecutions.set(executionId, executionPromise);

      // Wait for execution to complete
      const result = await executionPromise;

      // Remove from running executions
      this.runningExecutions.delete(executionId);

      // Update agent metrics
      await agent.updateMetrics({
        success: result.status === 'COMPLETED',
        duration: result.duration,
        cost: this.calculateExecutionCost(result),
      });

      // Emit execution complete event
      this.emitExecutionEvent('execution:completed', executionContext, {
        result,
        metrics: result.metrics,
      });

      logger.agent('Execution completed', {
        agentId: agentId.toString(),
        executionId,
        status: result.status,
        duration: result.duration,
        totalSteps: result.metrics.totalSteps,
        successfulSteps: result.metrics.successfulSteps,
      });

      return result;

    } catch (error: any) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Remove from running executions
      this.runningExecutions.delete(executionId);

      const errorResult: ExecutionResult = {
        executionId,
        agentId,
        status: 'FAILED',
        steps: [],
        variables: {},
        duration,
        startTime,
        endTime,
        error,
        metrics: {
          totalSteps: 0,
          successfulSteps: 0,
          failedSteps: 1,
          skippedSteps: 0,
        },
      };

      // Emit execution failed event
      this.emitExecutionEvent('execution:failed', context as ExecutionContext, {
        error: error.message,
        duration,
      });

      logger.agent('Execution failed', {
        agentId: agentId.toString(),
        executionId,
        error: error.message,
        duration,
      });

      throw error;
    }
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflow(
    agent: IAgent,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = new Date();
    const steps: StepResult[] = [];
    const state = {
      variables: { ...context.variables },
      executionContext: context,
    };

    try {
      // Validate workflow
      this.workflowEngine.validateWorkflow(agent.configuration.workflow);

      // Get execution order
      const executionOrder = this.workflowEngine.getExecutionOrder(
        agent.configuration.workflow
      );

      logger.debug('Workflow execution order determined', {
        agentId: agent._id.toString(),
        executionId: context.executionId,
        stepCount: executionOrder.length,
      });

      // Execute steps in order
      for (const step of executionOrder) {
        const stepResult = await this.executeStep(step, state, context);
        steps.push(stepResult);

        // Emit step completion event
        this.emitExecutionEvent('step:completed', context, {
          step: stepResult,
          variables: state.variables,
        });

        // Handle step failure
        if (stepResult.status === 'FAILURE') {
          const errorHandling = step.errorHandling;
          
          if (errorHandling.strategy === 'STOP') {
            logger.warn('Step failed, stopping execution', {
              stepId: step.id,
              executionId: context.executionId,
              error: stepResult.error?.message,
            });
            break;
          } else if (errorHandling.strategy === 'ROLLBACK') {
            logger.info('Step failed, rolling back execution', {
              stepId: step.id,
              executionId: context.executionId,
            });
            await this.rollbackExecution(steps, context);
            break;
          } else if (errorHandling.strategy === 'CONTINUE') {
            logger.info('Step failed, continuing execution', {
              stepId: step.id,
              executionId: context.executionId,
            });
            continue;
          }
        }

        // Check for conditional execution
        const nextStep = this.workflowEngine.getNextStep(
          step,
          agent.configuration.workflow,
          state.variables
        );

        if (!nextStep) {
          logger.debug('No next step found, execution complete', {
            stepId: step.id,
            executionId: context.executionId,
          });
          break;
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Calculate metrics
      const metrics = {
        totalSteps: steps.length,
        successfulSteps: steps.filter(s => s.status === 'SUCCESS').length,
        failedSteps: steps.filter(s => s.status === 'FAILURE').length,
        skippedSteps: steps.filter(s => s.status === 'SKIPPED').length,
      };

      // Determine overall status
      const status = metrics.failedSteps > 0 ? 'FAILED' : 'COMPLETED';

      return {
        executionId: context.executionId,
        agentId: agent._id,
        status,
        steps,
        variables: state.variables,
        duration,
        startTime,
        endTime,
        metrics,
      };

    } catch (error: any) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Rollback on unhandled errors
      logger.error('Unhandled error during workflow execution', {
        agentId: agent._id.toString(),
        executionId: context.executionId,
        error: error.message,
      });

      await this.rollbackExecution(steps, context);

      return {
        executionId: context.executionId,
        agentId: agent._id,
        status: 'FAILED',
        steps,
        variables: state.variables,
        duration,
        startTime,
        endTime,
        error,
        metrics: {
          totalSteps: steps.length,
          successfulSteps: steps.filter(s => s.status === 'SUCCESS').length,
          failedSteps: steps.filter(s => s.status === 'FAILURE').length + 1,
          skippedSteps: steps.filter(s => s.status === 'SKIPPED').length,
        },
      };
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: IWorkflowStep,
    state: any,
    context: ExecutionContext
  ): Promise<StepResult> {
    const stepStartTime = Date.now();

    logger.debug('Executing step', {
      stepId: step.id,
      stepType: step.type,
      toolType: step.toolType,
      executionId: context.executionId,
    });

    try {
      // Get tool for step type
      const tool = this.toolRegistry.getTool(step.toolType);
      
      if (!tool) {
        throw new CustomError(`Tool not found: ${step.toolType}`, 500, 'TOOL_NOT_FOUND');
      }

      // Resolve step parameters with variables
      const parameters = this.resolveParameters(
        step.parameters,
        state.variables
      );

      // Emit step start event
      this.emitExecutionEvent('step:started', context, {
        stepId: step.id,
        stepName: step.name,
        toolType: step.toolType,
        parameters,
      });

      // Execute tool with timeout
      const timeout = step.timeout || 30000; // 30 seconds default
      const result = await Promise.race([
        tool.execute(parameters, context),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Step execution timeout: ${step.id}`)), timeout)
        )
      ]);

      const duration = Date.now() - stepStartTime;

      // Update state variables with step output
      if (result && typeof result === 'object') {
        Object.assign(state.variables, result);
      }

      const stepResult: StepResult = {
        stepId: step.id,
        status: 'SUCCESS',
        output: result,
        duration,
        timestamp: new Date(),
      };

      logger.debug('Step executed successfully', {
        stepId: step.id,
        executionId: context.executionId,
        duration,
      });

      return stepResult;

    } catch (error: any) {
      const duration = Date.now() - stepStartTime;

      const stepResult: StepResult = {
        stepId: step.id,
        status: 'FAILURE',
        output: null,
        duration,
        error,
        timestamp: new Date(),
      };

      logger.error('Step execution failed', {
        stepId: step.id,
        executionId: context.executionId,
        error: error.message,
        duration,
      });

      return stepResult;
    }
  }

  /**
   * Resolve parameters with variable substitution
   */
  private resolveParameters(
    parameters: Record<string, any>,
    variables: Record<string, any>
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        // Variable substitution: ${variableName}
        const varName = value.slice(2, -1);
        const varValue = this.getNestedValue(variables, varName);
        resolved[key] = varValue !== undefined ? varValue : value;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursive resolution for nested objects
        resolved[key] = this.resolveParameters(value, variables);
      } else if (Array.isArray(value)) {
        // Resolve arrays
        resolved[key] = value.map(item =>
          typeof item === 'object' ? this.resolveParameters(item, variables) : item
        );
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Rollback executed steps on failure
   */
  private async rollbackExecution(
    steps: StepResult[],
    context: ExecutionContext
  ): Promise<void> {
    logger.info('Rolling back execution...', {
      agentId: context.agentId.toString(),
      executionId: context.executionId,
      stepsToRollback: steps.filter(s => s.status === 'SUCCESS').length,
    });
    
    // Execute rollback for each completed step in reverse order
    const successfulSteps = steps.filter(s => s.status === 'SUCCESS').reverse();
    
    for (const step of successfulSteps) {
      try {
        const tool = this.toolRegistry.getTool(step.stepId);
        if (tool && tool.rollback) {
          await tool.rollback(step.output, context);
          logger.debug(`Rolled back step: ${step.stepId}`, {
            executionId: context.executionId,
          });
        }
      } catch (error: any) {
        logger.error(`Rollback failed for step ${step.stepId}`, {
          error: error.message,
          executionId: context.executionId,
        });
        // Continue with remaining rollbacks even if one fails
      }
    }

    // Emit rollback complete event
    this.emitExecutionEvent('execution:rolledback', context, {
      stepCount: successfulSteps.length,
    });
  }

  /**
   * Cancel running execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.runningExecutions.get(executionId);
    
    if (!execution) {
      logger.warn('Attempted to cancel non-existent execution', { executionId });
      return false;
    }

    try {
      // In a real implementation, you'd need to implement cancellation tokens
      // For now, we'll just remove it from tracking
      this.runningExecutions.delete(executionId);
      
      logger.info('Execution cancelled', { executionId });
      return true;
    } catch (error: any) {
      logger.error('Failed to cancel execution', {
        executionId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): {
    isRunning: boolean;
    startTime?: Date;
  } {
    const execution = this.runningExecutions.get(executionId);
    return {
      isRunning: !!execution,
      startTime: execution ? new Date() : undefined,
    };
  }

  /**
   * Get all running executions
   */
  getRunningExecutions(): string[] {
    return Array.from(this.runningExecutions.keys());
  }

  /**
   * Calculate execution cost
   */
  private calculateExecutionCost(result: ExecutionResult): number {
    // Base cost per step
    const baseCost = 0.01;
    
    // Additional cost based on duration (per second)
    const durationCost = (result.duration / 1000) * 0.001;
    
    return (result.metrics.totalSteps * baseCost) + durationCost;
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `exec_${timestamp}_${random}`;
  }

  /**
   * Emit execution events via WebSocket
   */
  private emitExecutionEvent(
    event: string,
    context: ExecutionContext,
    data: any
  ): void {
    const io = server.getIO();
    if (!io) return;

    const eventData = {
      event,
      executionId: context.executionId,
      agentId: context.agentId,
      tenantId: context.tenantId,
      timestamp: new Date().toISOString(),
      data,
    };

    // Emit to tenant-specific room
    io.to(`tenant:${context.tenantId}`).emit('agent:execution', eventData);

    // Emit to user-specific room
    io.to(`user:${context.userId}`).emit('agent:execution', eventData);

    logger.debug('Execution event emitted', {
      event,
      executionId: context.executionId,
      tenantId: context.tenantId.toString(),
    });
  }
}

export default AgentOrchestrator;
