import { Request, Response, NextFunction } from "express";

/**
 * Structured logging service for requests and events
 * Features: request tracking, performance monitoring, error logging
 */

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  method?: string;
  path?: string;
  duration?: number;
  status?: number;
  userId?: string;
  error?: string;
  details?: Record<string, any>;
}

class LogService {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  /**
   * Log an info message
   */
  info(message: string, details?: Record<string, any>) {
    this.addLog("INFO", message, details);
  }

  /**
   * Log a warning
   */
  warn(message: string, details?: Record<string, any>) {
    this.addLog("WARN", message, details);
  }

  /**
   * Log an error
   */
  error(message: string, error?: Error, details?: Record<string, any>) {
    this.addLog("ERROR", message, {
      ...details,
      error: error?.message,
      stack: error?.stack
    });
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, details?: Record<string, any>) {
    if (process.env.NODE_ENV === "development") {
      this.addLog("DEBUG", message, details);
    }
  }

  /**
   * Internal: add log entry
   */
  private addLog(
    level: LogEntry["level"],
    message: string,
    details?: Record<string, any>
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...details
    };

    console.log(`[${level}] ${message}`, details || "");

    this.logs.push(entry);

    // Keep memory usage bounded
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Get all logs
   */
  getLogs(filter?: { level?: string; limit?: number }): LogEntry[] {
    let result = [...this.logs];

    if (filter?.level) {
      result = result.filter(l => l.level === filter.level);
    }

    if (filter?.limit) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Get logs count
   */
  count() {
    return this.logs.length;
  }
}

/**
 * Express middleware for automatic request logging
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Log incoming request
  logService.debug(`${req.method} ${req.path}`, {
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userId: (req as any).user?.id
  });

  // Capture response
  const originalJson = res.json;
  res.json = function (body: any) {
    const duration = Date.now() - startTime;
    const logMethod = res.statusCode >= 400 ? "warn" : "info";

    if (logMethod === "warn") {
      logService.warn(`${req.method} ${req.path} ${res.statusCode}`, {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        userId: (req as any).user?.id
      });
    } else {
      logService.info(`${req.method} ${req.path} ${res.statusCode}`, {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        userId: (req as any).user?.id
      });
    }

    return originalJson.call(this, body);
  };

  next();
}

export const logService = new LogService();

export default logService;
