import type { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '../utils/uuid.util';
import logger from '../config/logger.config';

/**
 * Request ID middleware
 * Adds a unique request ID to each request for tracing
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

/**
 * Request logging middleware
 * Logs all incoming requests with details
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  
  next();
}

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
