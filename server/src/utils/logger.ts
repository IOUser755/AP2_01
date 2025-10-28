import type { LogContext } from '../config/logger.js';
import { logger as coreLogger } from '../config/logger.js';

class AuditLogger {
  info(message: string, context: LogContext = {}): void {
    coreLogger.info(message, { ...context, category: 'audit' });
  }

  warn(message: string, context: LogContext = {}): void {
    coreLogger.warn(message, { ...context, category: 'audit' });
  }

  error(message: string, context: LogContext = {}): void {
    coreLogger.error(message, { ...context, category: 'audit' });
  }

  record(event: string, context: LogContext = {}): void {
    coreLogger.info(`Audit: ${event}`, { ...context, category: 'audit' });
  }
}

export const auditLogger = new AuditLogger();

export const logger = coreLogger;

export type { LogContext };
