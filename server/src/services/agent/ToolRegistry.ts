import { logger } from '../../config/logger.js';
import { CustomError } from '../../utils/errors.js';
import { ExecutionContext } from './AgentOrchestrator.js';

export interface Tool {
  name: string;
  description: string;
  category: 'PAYMENT' | 'DATA' | 'COMMUNICATION' | 'LOGIC' | 'INTEGRATION' | 'CUSTOM';
  version: string;
  parameters: ToolParameter[];
  requiredPermissions: string[];
  
  // Core methods
  execute(parameters: Record<string, any>, context: ExecutionContext): Promise<any>;
  validate(parameters: Record<string, any>): boolean;
  rollback?(output: any, context: ExecutionContext): Promise<void>;
  
  // Metadata
  cost?: number; // Execution cost
  timeout?: number; // Max execution time in ms
  retryable?: boolean; // Can be retried on failure
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

/**
 * HTTP Request Tool
 */
class HttpRequestTool implements Tool {
  name = 'http_request';
  description = 'Make HTTP requests to external APIs';
  category = 'INTEGRATION' as const;
  version = '1.0.0';
  requiredPermissions = ['http_request'];
  parameters: ToolParameter[] = [
    {
      name: 'url',
      type: 'string',
      required: true,
      description: 'Target URL for the HTTP request',
    },
    {
      name: 'method',
      type: 'string',
      required: false,
      description: 'HTTP method',
      defaultValue: 'GET',
      validation: {
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      },
    },
    {
      name: 'headers',
      type: 'object',
      required: false,
      description: 'HTTP headers',
      defaultValue: {},
    },
    {
      name: 'body',
      type: 'object',
      required: false,
      description: 'Request body',
    },
    {
      name: 'timeout',
      type: 'number',
      required: false,
      description: 'Request timeout in milliseconds',
      defaultValue: 30000,
      validation: {
        min: 1000,
        max: 60000,
      },
    },
  ];

  async execute(parameters: Record<string, any>, context: ExecutionContext): Promise<any> {
    const { url, method = 'GET', headers = {}, body, timeout = 30000 } = parameters;

    logger.debug('Executing HTTP request', {
      url,
      method,
      executionId: context.executionId,
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AgentPay-Hub/1.0',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: await response.text(),
      };

      // Try to parse JSON if possible
      try {
        responseData.data = JSON.parse(responseData.data);
      } catch {
        // Keep as text if not valid JSON
      }

      return responseData;
    } catch (error: any) {
      logger.error('HTTP request failed', {
        url,
        method,
        error: error.message,
        executionId: context.executionId,
      });
      throw new CustomError(`HTTP request failed: ${error.message}`, 500, 'HTTP_REQUEST_FAILED');
    }
  }

  validate(parameters: Record<string, any>): boolean {
    if (!parameters.url || typeof parameters.url !== 'string') {
      return false;
    }

    try {
      new URL(parameters.url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Email Tool
 */
class EmailTool implements Tool {
  name = 'send_email';
  description = 'Send emails using configured email service';
  category = 'COMMUNICATION' as const;
  version = '1.0.0';
  requiredPermissions = ['send_email'];
  parameters: ToolParameter[] = [
    {
      name: 'to',
      type: 'string',
      required: true,
      description: 'Recipient email address',
    },
    {
      name: 'subject',
      type: 'string',
      required: true,
      description: 'Email subject',
    },
    {
      name: 'body',
      type: 'string',
      required: true,
      description: 'Email body content',
    },
    {
      name: 'html',
      type: 'boolean',
      required: false,
      description: 'Whether body is HTML',
      defaultValue: false,
    },
    {
      name: 'cc',
      type: 'array',
      required: false,
      description: 'CC email addresses',
      defaultValue: [],
    },
    {
      name: 'bcc',
      type: 'array',
      required: false,
      description: 'BCC email addresses',
      defaultValue: [],
    },
  ];

  async execute(parameters: Record<string, any>, context: ExecutionContext): Promise<any> {
    const { to, subject, body, html = false, cc = [], bcc = [] } = parameters;

    logger.info('Sending email', {
      to,
      subject,
      executionId: context.executionId,
    });

    // In a real implementation, integrate with email service (SendGrid, etc.)
    // For now, we'll simulate email sending
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          messageId: `msg_${Date.now()}`,
          status: 'sent',
          to,
          subject,
          sentAt: new Date().toISOString(),
        });
      }, 1000);
    });
  }

  validate(parameters: Record<string, any>): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(parameters.to) && 
           typeof parameters.subject === 'string' && 
           typeof parameters.body === 'string';
  }
}

/**
 * Condition Tool
 */
class ConditionTool implements Tool {
  name = 'condition';
  description = 'Evaluate conditional expressions';
  category = 'LOGIC' as const;
  version = '1.0.0';
  requiredPermissions = [];
  parameters: ToolParameter[] = [
    {
      name: 'expression',
      type: 'string',
      required: true,
      description: 'Conditional expression to evaluate',
    },
    {
      name: 'variables',
      type: 'object',
      required: false,
      description: 'Variables to use in expression',
      defaultValue: {},
    },
  ];

  async execute(parameters: Record<string, any>, context: ExecutionContext): Promise<any> {
    const { expression, variables = {} } = parameters;

    logger.debug('Evaluating condition', {
      expression,
      executionId: context.executionId,
    });

    try {
      // Simple expression evaluation
      // In production, use a proper expression evaluator like expr-eval
      const result = this.evaluateExpression(expression, {
        ...variables,
        ...context.variables,
      });

      return {
        result,
        expression,
        variables: variables,
      };
    } catch (error: any) {
      logger.error('Condition evaluation failed', {
        expression,
        error: error.message,
        executionId: context.executionId,
      });
      throw new CustomError(`Condition evaluation failed: ${error.message}`, 500, 'CONDITION_FAILED');
    }
  }

  validate(parameters: Record<string, any>): boolean {
    return typeof parameters.expression === 'string' && parameters.expression.length > 0;
  }

  private evaluateExpression(expression: string, variables: Record<string, any>): boolean {
    // Basic expression evaluation
    // Replace variables in expression
    let processedExpression = expression;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      const replacement = typeof value === 'string' ? `"${value}"` : String(value);
      processedExpression = processedExpression.replace(regex, replacement);
    }

    // Evaluate the expression (simplified version)
    try {
      // In production, use a safe expression evaluator
      const func = new Function(`return ${processedExpression}`);
      return Boolean(func());
    } catch {
      return false;
    }
  }
}

/**
 * Wait Tool
 */
class WaitTool implements Tool {
  name = 'wait';
  description = 'Wait for a specified duration';
  category = 'LOGIC' as const;
  version = '1.0.0';
  requiredPermissions = [];
  parameters: ToolParameter[] = [
    {
      name: 'duration',
      type: 'number',
      required: true,
      description: 'Wait duration in milliseconds',
      validation: {
        min: 100,
        max: 300000, // 5 minutes max
      },
    },
  ];

  async execute(parameters: Record<string, any>, context: ExecutionContext): Promise<any> {
    const { duration } = parameters;

    logger.debug('Waiting', {
      duration,
      executionId: context.executionId,
    });

    await new Promise(resolve => setTimeout(resolve, duration));

    return {
      waited: duration,
      timestamp: new Date().toISOString(),
    };
  }

  validate(parameters: Record<string, any>): boolean {
    return typeof parameters.duration === 'number' && 
           parameters.duration >= 100 && 
           parameters.duration <= 300000;
  }
}

/**
 * Tool Registry Class
 */
class ToolRegistry {
  private tools: Map<string, Tool>;
  private categories: Map<string, string[]>;

  constructor() {
    this.tools = new Map();
    this.categories = new Map();
    this.registerDefaultTools();
  }

  /**
   * Register default tools
   */
  private registerDefaultTools(): void {
    const defaultTools = [
      new HttpRequestTool(),
      new EmailTool(),
      new ConditionTool(),
      new WaitTool(),
    ];

    for (const tool of defaultTools) {
      this.registerTool(tool);
    }

    logger.info('Default tools registered', {
      toolCount: defaultTools.length,
      tools: defaultTools.map(t => t.name),
    });
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    // Validate tool
    if (!tool.name || !tool.execute) {
      throw new CustomError('Invalid tool: name and execute method required', 400, 'INVALID_TOOL');
    }

    // Check if tool already exists
    if (this.tools.has(tool.name)) {
      logger.warn('Tool already exists, overwriting', { toolName: tool.name });
    }

    // Register tool
    this.tools.set(tool.name, tool);

    // Update categories
    if (!this.categories.has(tool.category)) {
      this.categories.set(tool.category, []);
    }
    this.categories.get(tool.category)!.push(tool.name);

    logger.info('Tool registered', {
      toolName: tool.name,
      category: tool.category,
      version: tool.version,
    });
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): Tool | null {
    return this.tools.get(name) || null;
  }

  /**
   * Get all tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): Tool[] {
    const toolNames = this.categories.get(category) || [];
    return toolNames.map(name => this.tools.get(name)!).filter(Boolean);
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Remove a tool
   */
  removeTool(name: string): boolean {
    const tool = this.tools.get(name);
    if (!tool) return false;

    this.tools.delete(name);

    // Update categories
    const categoryTools = this.categories.get(tool.category);
    if (categoryTools) {
      const index = categoryTools.indexOf(name);
      if (index > -1) {
        categoryTools.splice(index, 1);
      }
      if (categoryTools.length === 0) {
        this.categories.delete(tool.category);
      }
    }

    logger.info('Tool removed', { toolName: name });
    return true;
  }

  /**
   * Check if user has permission to use tool
   */
  checkPermission(toolName: string, userPermissions: string[]): boolean {
    const tool = this.tools.get(toolName);
    if (!tool) return false;

    // Check if user has required permissions
    return tool.requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  }

  /**
   * Get tool metadata
   */
  getToolMetadata(name: string): Partial<Tool> | null {
    const tool = this.tools.get(name);
    if (!tool) return null;

    return {
      name: tool.name,
      description: tool.description,
      category: tool.category,
      version: tool.version,
      parameters: tool.parameters,
      requiredPermissions: tool.requiredPermissions,
      cost: tool.cost,
      timeout: tool.timeout,
      retryable: tool.retryable,
    };
  }

  /**
   * Validate tool parameters
   */
  validateParameters(toolName: string, parameters: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { valid: false, errors: ['Tool not found'] };
    }

    const errors: string[] = [];

    // Check required parameters
    for (const param of tool.parameters) {
      if (param.required && !(param.name in parameters)) {
        errors.push(`Missing required parameter: ${param.name}`);
        continue;
      }

      const value = parameters[param.name];
      if (value === undefined || value === null) {
        if (param.required) {
          errors.push(`Parameter ${param.name} cannot be null or undefined`);
        }
        continue;
      }

      // Type validation
      if (param.type === 'string' && typeof value !== 'string') {
        errors.push(`Parameter ${param.name} must be a string`);
      } else if (param.type === 'number' && typeof value !== 'number') {
        errors.push(`Parameter ${param.name} must be a number`);
      } else if (param.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Parameter ${param.name} must be a boolean`);
      } else if (param.type === 'object' && typeof value !== 'object') {
        errors.push(`Parameter ${param.name} must be an object`);
      } else if (param.type === 'array' && !Array.isArray(value)) {
        errors.push(`Parameter ${param.name} must be an array`);
      }

      // Validation rules
      if (param.validation) {
        if (param.validation.min !== undefined && value < param.validation.min) {
          errors.push(`Parameter ${param.name} must be at least ${param.validation.min}`);
        }
        if (param.validation.max !== undefined && value > param.validation.max) {
          errors.push(`Parameter ${param.name} must be at most ${param.validation.max}`);
        }
        if (param.validation.pattern && typeof value === 'string') {
          const regex = new RegExp(param.validation.pattern);
          if (!regex.test(value)) {
            errors.push(`Parameter ${param.name} does not match required pattern`);
          }
        }
        if (param.validation.enum && !param.validation.enum.includes(value)) {
          errors.push(`Parameter ${param.name} must be one of: ${param.validation.enum.join(', ')}`);
        }
      }
    }

    // Use tool's own validation if available
    if (errors.length === 0 && tool.validate) {
      try {
        if (!tool.validate(parameters)) {
          errors.push('Tool-specific validation failed');
        }
      } catch (error: any) {
        errors.push(`Validation error: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default ToolRegistry;
