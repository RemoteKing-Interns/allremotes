
export interface LogEntry {
  id?: string;
  _id?: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  action: string;
  userId?: string;
  userEmail?: string;
  details?: any;
  ip?: string;
  userAgent?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

// Client-side logger that doesn't import MongoDB
class ClientLogger {
  private static instance: ClientLogger;
  private logBuffer: LogEntry[] = [];
  private bufferSize = 50; // Smaller buffer for client-side

  private constructor() {
    // Send logs to server every 5 seconds
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), 5000);
    }
  }

  static getInstance(): ClientLogger {
    if (!ClientLogger.instance) {
      ClientLogger.instance = new ClientLogger();
    }
    return ClientLogger.instance;
  }

  async log(entry: Omit<LogEntry, 'id' | '_id' | 'timestamp'>): Promise<void> {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      await this.flush();
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${logEntry.level.toUpperCase()}] ${logEntry.action}`, logEntry.details || '');
    }
  }

  async info(action: string, details?: any, context?: Partial<LogEntry>): Promise<void> {
    await this.log({
      level: 'info',
      action,
      details,
      ...context,
    });
  }

  async warn(action: string, details?: any, context?: Partial<LogEntry>): Promise<void> {
    await this.log({
      level: 'warn',
      action,
      details,
      ...context,
    });
  }

  async error(action: string, details?: any, context?: Partial<LogEntry>): Promise<void> {
    await this.log({
      level: 'error',
      action,
      details,
      ...context,
    });
  }

  async debug(action: string, details?: any, context?: Partial<LogEntry>): Promise<void> {
    await this.log({
      level: 'debug',
      action,
      details,
      ...context,
    });
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Send logs to server endpoint
      await fetch('/api/admin/logs/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToFlush }),
      });
    } catch (error) {
      console.error('Failed to send logs to server:', error);
      // Add logs back to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }
}

// Export client-side singleton instance
export const logger = ClientLogger.getInstance();

// Helper function to get user context from request
export function getUserContext(request: any): Partial<LogEntry> {
  return {
    ip: request?.ip || request?.headers?.['x-forwarded-for'] || 'unknown',
    userAgent: request?.headers?.['user-agent'] || 'unknown',
    route: request?.url || 'unknown',
    method: request?.method || 'unknown',
  };
}

// Middleware helper for API routes
export function withLogging(handler: Function) {
  return async (request: any, ...args: any[]) => {
    const startTime = Date.now();
    const context = getUserContext(request);
    
    try {
      const result = await handler(request, ...args);
      const duration = Date.now() - startTime;
      
      await logger.info(`${request.method} ${request.url}`, {
        statusCode: result?.status || 200,
        duration,
      }, {
        ...context,
        statusCode: result?.status,
        duration,
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      await logger.error(`${request.method} ${request.url}`, {
        error: error.message,
        stack: error.stack,
        statusCode: error.status || 500,
        duration,
      }, {
        ...context,
        error: error.message,
        statusCode: error.status,
        duration,
      });

      throw error;
    }
  };
}
