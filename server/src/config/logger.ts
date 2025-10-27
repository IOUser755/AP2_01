import winston from 'winston';
import config from './keys.js';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
});

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => {
    const metadata = info.metadata && Object.keys(info.metadata).length > 0
      ? `\n${JSON.stringify(info.metadata, null, 2)}`
      : '';
    return `${info.timestamp} [${info.level}]: ${info.message}${metadata}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
);

const getLogLevel = (): string => {
  if (config.nodeEnv === 'development') return 'debug';
  if (config.nodeEnv === 'test') return 'warn';
  return config.logLevel;
};

const createTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
    transports.push(
      new winston.transports.Console({
        level: getLogLevel(),
        format: consoleFormat,
      })
    );
  }

  if (config.nodeEnv === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: fileFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
        tailable: true,
      })
    );

    transports.push(
      new winston.transports.File({
        filename: 'logs/combined.log',
        level: getLogLevel(),
        format: fileFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10,
        tailable: true,
      })
    );

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

const baseLogger = winston.createLogger({
  level: getLogLevel(),
  levels,
  transports: createTransports(),
  exitOnError: false,
  silent: config.nodeEnv === 'test',
});

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

interface LogContext {
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
  constructor(private readonly winstonLogger: winston.Logger) {}

  error(message: string, context?: LogContext | Error): void {
    if (context instanceof Error) {
      this.winstonLogger.error(message, {
        error: {
          name: context.name,
          message: context.message,
          stack: context.stack,
        },
      });
      return;
    }

    this.winstonLogger.error(message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.winstonLogger.warn(message, context);
  }

  info(message: string, context?: LogContext): void {
    this.winstonLogger.info(message, context);
  }

  http(message: string, context?: LogContext): void {
    this.winstonLogger.http(message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.winstonLogger.debug(message, context);
  }

  auth(event: string, context: LogContext): void {
    this.info(`Auth: ${event}`, { ...context, category: 'authentication' });
  }

  transaction(event: string, context: LogContext): void {
    this.info(`Transaction: ${event}`, { ...context, category: 'transaction' });
  }

  agent(event: string, context: LogContext): void {
    this.info(`Agent: ${event}`, { ...context, category: 'agent' });
  }

  mandate(event: string, context: LogContext): void {
    this.info(`Mandate: ${event}`, { ...context, category: 'mandate' });
  }

  security(event: string, context: LogContext): void {
    this.warn(`Security: ${event}`, { ...context, category: 'security' });
  }

  performance(metric: string, value: number, context?: LogContext): void {
    this.info(`Performance: ${metric}`, {
      ...context,
      metric,
      value,
      unit: 'ms',
      category: 'performance',
    });
  }

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

const enhancedLogger = new EnhancedLogger(baseLogger);

export { enhancedLogger as logger };
export default enhancedLogger;
