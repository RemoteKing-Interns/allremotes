import { mongoEnabled, getDb } from "./mongo";
import { LogEntry } from "./logger";

const LOG_RETENTION_DAYS = 90;

// Server-side logger that handles database operations
class ServerLogger {
  private static instance: ServerLogger;
  private logBuffer: LogEntry[] = [];
  private bufferSize = 100;
  private flushInterval = 5000; // 5 seconds
  private ttlIndexEnsured = false;

  private constructor() {
    // Start periodic flush
    setInterval(() => this.flush(), this.flushInterval);
  }

  /** Creates a TTL index so MongoDB auto-deletes logs older than LOG_RETENTION_DAYS. */
  private async ensureTtlIndex(): Promise<void> {
    if (this.ttlIndexEnsured || !mongoEnabled()) return;
    this.ttlIndexEnsured = true;
    try {
      const db = await getDb();
      await db.collection("admin_logs").createIndex(
        { timestamp: 1 },
        { expireAfterSeconds: LOG_RETENTION_DAYS * 24 * 60 * 60, background: true }
      );
    } catch {
      // Non-fatal — index may already exist or DB unavailable
    }
  }

  static getInstance(): ServerLogger {
    if (!ServerLogger.instance) {
      ServerLogger.instance = new ServerLogger();
    }
    return ServerLogger.instance;
  }

  async log(entry: Omit<LogEntry, 'id' | '_id' | 'timestamp'>): Promise<void> {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${logEntry.level.toUpperCase()}] ${logEntry.action}`, logEntry.details || '');
    }

    // Write immediately — serverless environments don't reliably run setInterval
    try {
      if (mongoEnabled()) {
        // Ensure TTL index exists (no-op after first call)
        await this.ensureTtlIndex();
        const db = await getDb();
        await db.collection("admin_logs").insertOne(logEntry as any);
      } else if (typeof window !== 'undefined') {
        // localStorage fallback: prune entries older than LOG_RETENTION_DAYS
        const cutoff = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
        const existing = JSON.parse(localStorage.getItem('adminLogs') || '[]');
        const pruned = existing.filter((l: LogEntry) => new Date(l.timestamp) >= cutoff);
        pruned.push(logEntry);
        localStorage.setItem('adminLogs', JSON.stringify(pruned));
      }
    } catch (err) {
      console.error('Failed to write log:', err);
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
      if (mongoEnabled()) {
        const db = await getDb();
        const collection = db.collection("admin_logs");
        
        if (logsToFlush.length > 0) {
          await collection.insertMany(logsToFlush as any);
        }
      } else {
        // Fallback to localStorage for development
        if (typeof window !== 'undefined') {
          const existingLogs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
          const updatedLogs = [...existingLogs, ...logsToFlush];
          
          // Keep only last 1000 logs in localStorage
          if (updatedLogs.length > 1000) {
            updatedLogs.splice(0, updatedLogs.length - 1000);
          }
          
          localStorage.setItem('adminLogs', JSON.stringify(updatedLogs));
        }
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Add logs back to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  async getLogs(filters?: {
    level?: string;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      if (mongoEnabled()) {
        const db = await getDb();
        const collection = db.collection("admin_logs");

        // Build query
        const query: any = {};
        if (filters?.level) query.level = filters.level;
        if (filters?.userId) query.userId = filters.userId;
        if (filters?.action) query.action = { $regex: filters.action, $options: 'i' };
        if (filters?.startDate || filters?.endDate) {
          query.timestamp = {};
          if (filters.startDate) query.timestamp.$gte = filters.startDate;
          if (filters.endDate) query.timestamp.$lte = filters.endDate;
        }

        // Get total count
        const total = await collection.countDocuments(query);

        // Get logs with pagination
        const cursor = collection
          .find(query)
          .sort({ timestamp: -1 })
          .skip(filters?.offset || 0)
          .limit(filters?.limit || 100);

        const logs = await cursor.toArray() as unknown as LogEntry[];

        return { logs, total };
      } else {
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          const allLogs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
          
          let filteredLogs = allLogs;
          
          if (filters?.level) {
            filteredLogs = filteredLogs.filter((log: LogEntry) => log.level === filters.level);
          }
          if (filters?.userId) {
            filteredLogs = filteredLogs.filter((log: LogEntry) => log.userId === filters.userId);
          }
          if (filters?.action) {
            filteredLogs = filteredLogs.filter((log: LogEntry) => 
              log.action.toLowerCase().includes(filters.action!.toLowerCase())
            );
          }
          if (filters?.startDate || filters?.endDate) {
            filteredLogs = filteredLogs.filter((log: LogEntry) => {
              const logDate = new Date(log.timestamp);
              if (filters.startDate && logDate < filters.startDate) return false;
              if (filters.endDate && logDate > filters.endDate) return false;
              return true;
            });
          }

          // Sort by timestamp descending
          filteredLogs.sort((a: LogEntry, b: LogEntry) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          const total = filteredLogs.length;
          const offset = filters?.offset || 0;
          const limit = filters?.limit || 100;
          const logs = filteredLogs.slice(offset, offset + limit);

          return { logs, total };
        }
        
        return { logs: [], total: 0 };
      }
    } catch (error) {
      console.error('Failed to get logs:', error);
      return { logs: [], total: 0 };
    }
  }

  async clearLogs(olderThan?: Date): Promise<void> {
    try {
      if (mongoEnabled()) {
        const db = await getDb();
        const collection = db.collection("admin_logs");

        if (olderThan) {
          await collection.deleteMany({ timestamp: { $lt: olderThan } });
        } else {
          await collection.deleteMany({});
        }
      } else {
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          if (olderThan) {
            const logs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
            const filteredLogs = logs.filter((log: LogEntry) => 
              new Date(log.timestamp) >= olderThan
            );
            localStorage.setItem('adminLogs', JSON.stringify(filteredLogs));
          } else {
            localStorage.removeItem('adminLogs');
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}

// Export server-side singleton instance
export const serverLogger = ServerLogger.getInstance();
