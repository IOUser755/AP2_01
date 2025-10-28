export interface AppErrorOptions {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  metadata?: Record<string, unknown>;
}

export class AppError extends Error {
  statusCode: number;
  code?: string;
  isOperational: boolean;
  metadata?: Record<string, unknown>;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);

    this.statusCode = options.statusCode ?? 500;
    this.code = options.code;
    this.isOperational = options.isOperational ?? true;
    this.metadata = options.metadata;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
