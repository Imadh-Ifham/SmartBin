import { Request, Response, NextFunction } from "express";

// Custom Error Interface (optional)
interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default to 500 if statusCode not set
  const statusCode = err.statusCode || 500;

  // Log the full error (stack trace) for development
  console.error(`\n[Error] ${req.method} ${req.originalUrl}`);
  console.error(err.stack);

  // Return detailed error info in dev
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: err.stack, // include stack trace in dev
    errorName: err.name,
  });
};
