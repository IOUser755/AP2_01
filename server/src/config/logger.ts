import winston from 'winston';
import config from './keys.js';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
});

/**
 * Create custom format for console output
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${
      info.metadata && Object.keys(info.metadata).length > 0 
        ? '\n' + JSON.stringify(info.metadata, null, 2)
        : ''
    }`
  )
);

/**
 * Create custom format for file output
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
);

/**
 * Determine log level based on environment
 */
const getLogLevel = (): string => {
  if (config.nodeEnv === 'development') return 'debug';
  if (config.nodeEnv === 'test') return 'warn';
  return config.logLevel;
};

/**
 * Create transports based on environment
 */
const createTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Console transport for development
  if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
    transports.push(
      new winston.transports.Console({
        level: getLogLevel(),
        format: consoleFormat,
      })
    );
  }

  // File transports for production
  if (config.nodeEnv === 'production') {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: fileFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
      })
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: 'logs/combined.log',
        level: getLogLevel(),
        format: fileFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        tailable: true,
      })
    );

    // Console output in production (for Docker logs)
    transports.push(
      new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }

  return transports;
};

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: getLogLevel(),
  levels,
  transports: createTransports(),
  exitOnError: false,
  silent: config.nodeEnv === 'test',
});

/**
 * Create HTTP request logger for Express
 */
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
  silent: config.nodeEnv === 'test',
});

/**
 * Enhanced logging methods with structured data
 */
export interface LogContext {
  userId?: string;
  tenantId?: string;
  requestId?: string;
  agentId?: string;
  transactionId?: string;
  mandateId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

class EnhancedLogger {
  private winston: winston.Logger;

  constructor(winstonLogger: winston.Logger) {
    this.winston = winstonLogger;
  }

  error(message: string, context?: LogContext | Error): void {
    if (context instanceof Error) {
      this.winston.error(message, {
        error: {
          name: context.name,
          message: context.message,
          stack: context.stack,
        },
      });
    } else {
      this.winston.error(message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    this.winston.warn(message, context);
  }

  info(message: string, context?: LogContext): void {
    this.winston.info(message, context);
  }

  http(message: string, context?: LogContext): void {
    this.winston.http(message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.winston.debug(message, context);
  }

  /**
   * Log authentication events
   */
  auth(event: string, context: LogContext): void {
    this.info(`Auth: ${event}`, {
      ...context,
      category: 'authentication',
    });
  }

  /**
   * Log transaction events
   */
  transaction(event: string, context: LogContext): void {
    this.info(`Transaction: ${event}`, {
      ...context,
      category: 'transaction',
    });
  }

  /**
   * Log agent events
   */
  agent(event: string, context: LogContext): void {
    this.info(`Agent: ${event}`, {
      ...context,
      category: 'agent',
    });
  }

  /**
   * Log mandate events
   */
  mandate(event: string, context: LogContext): void {
    this.info(`Mandate: ${event}`, {
      ...context,
      category: 'mandate',
    });
  }

  /**
   * Log security events
   */
  security(event: string, context: LogContext): void {
    this.warn(`Security: ${event}`, {
      ...context,
      category: 'security',
    });
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, value: number, context?: LogContext): void {
    this.info(`Performance: ${metric}`, {
      ...context,
      metric,
      value,
      unit: 'ms',
      category: 'performance',
    });
  }

  /**
   * Log API calls
   */
  api(method: string, path: string, statusCode: number, responseTime: number, context?: LogContext): void {
    this.http(`${method} ${path} ${statusCode}`, {
      ...context,
      method,
      path,
      statusCode,
      responseTime,
      category: 'api',
    });
  }
}

// Export enhanced logger
const enhancedLogger = new EnhancedLogger(logger);

export { enhancedLogger as logger };
export default enhancedLogger;
