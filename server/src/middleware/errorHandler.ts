import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Global error handler middleware
 * Catches and formats all errors consistently
 * Features: structured logging, development vs production responses
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "INTERNAL_ERROR";
  const isDevelopment = process.env.NODE_ENV === "development";

  // Structured logging
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: status >= 500 ? "ERROR" : "WARN",
    method: req.method,
    path: req.path,
    status,
    code,
    message,
    userId: (req as any).user?.id || "anonymous",
    ...(isDevelopment && { stack: err.stack })
  };

  console[status >= 500 ? "error" : "warn"](JSON.stringify(logEntry, null, 2));

  // Response payload
  const errorResponse = {
    error: message,
    code,
    ...(err.details && { details: err.details }),
    ...(isDevelopment && {
      stack: err.stack,
      path: req.path,
      timestamp: logEntry.timestamp
    })
  };

  res.status(status).json(errorResponse);
};
