import { Request, Response, NextFunction } from 'express';

interface RequestMetrics {
  method: string;
  path: string;
  status: number;
  duration: number;
  userId?: string;
  userRole?: string;
  requestId: string;
  timestamp: string;
}

const requestMetrics: RequestMetrics[] = [];
const MAX_METRICS = 5000;

/**
 * Advanced metrics middleware
 * Tracks: response time, status codes, user actions, error rates
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  // Store request ID
  (req as any).requestId = requestId;

  // Capture response
  const originalJson = res.json;
  res.json = function (body: any) {
    const duration = Date.now() - startTime;
    const metric: RequestMetrics = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userId: (req as any).user?.id || 'anonymous',
      userRole: (req as any).user?.role,
      requestId,
      timestamp: new Date().toISOString()
    };

    requestMetrics.push(metric);
    if (requestMetrics.length > MAX_METRICS) {
      requestMetrics.shift();
    }

    // Log slow requests
    if (duration > 1000) {
      console.warn(`[SLOW] ${metric.method} ${metric.path} took ${duration}ms`);
    }

    // Log errors
    if (res.statusCode >= 400) {
      console.warn(`[${res.statusCode}] ${metric.method} ${metric.path}`);
    }

    return originalJson.call(this, body);
  };

  next();
}

/**
 * Get metrics snapshot
 */
export function getMetricsSnapshot() {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  const recentMetrics = requestMetrics.filter(
    m => new Date(m.timestamp).getTime() > oneHourAgo
  );

  const statusCodes = recentMetrics.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const avgDuration =
    recentMetrics.length > 0
      ? Math.round(recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length)
      : 0;

  const errorRate =
    recentMetrics.length > 0
      ? Math.round(
          (recentMetrics.filter(m => m.status >= 400).length / recentMetrics.length) * 100
        )
      : 0;

  return {
    totalRequests: recentMetrics.length,
    averageDuration: avgDuration,
    errorRate,
    statusCodes,
    topSlowEndpoints: recentMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map(m => ({ path: m.path, duration: m.duration }))
  };
}

/**
 * Clear metrics
 */
export function clearMetrics() {
  requestMetrics.length = 0;
}

export default { metricsMiddleware, getMetricsSnapshot, clearMetrics };
