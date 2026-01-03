/**
 * Request Logging Middleware
 * Log HTTP requests with timing and error tracking
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger.js';

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return uuidv4();
}

/**
 * Request logging middleware
 * Logs all incoming requests with timing information
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = generateRequestId();
  (req as any).requestId = requestId;
  
  const startTime = Date.now();
  const { method, url, ip } = req;

  // Log request start
  logger.info(`${method} ${url}`, {
    context: 'HTTP',
    metadata: {
      requestId,
      method,
      url,
      ip,
      userAgent: req.get('user-agent'),
      referer: req.get('referer'),
    },
  });

  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    const logLevel = statusCode >= 500 ? 'error' : 
                     statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](`${method} ${url} ${statusCode}`, {
      context: 'HTTP',
      metadata: {
        requestId,
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        ip,
      },
    });
  });

  next();
}

/**
 * Error logging middleware
 * Logs errors with full context
 */
export function errorLogger(
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId || 'unknown';

  logger.error('Request error', {
    context: 'HTTP',
    error: err,
    metadata: {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      body: req.body,
      query: req.query,
      params: req.params,
    },
  });

  next(err);
}

