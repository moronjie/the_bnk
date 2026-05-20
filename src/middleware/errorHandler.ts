import { Request, Response, NextFunction } from 'express';
import HTTP_STATUS, { HttpStatus } from '../config/http.confiq';
import config from '../config';

/**
 * Application Error Codes
 * Centralized error code constants for consistency
 */
export const errorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // User Errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_EXISTS: 'USER_EXISTS',

  // Validation & Data Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELDS: 'MISSING_FIELDS',
  INVALID_ID: 'INVALID_ID',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',

  // Server Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCodes = (typeof errorCodes)[keyof typeof errorCodes];

/**
 * Custom Error Class
 * @param message - Error message to display
 * @param errorCode - Application-specific error code (e.g., 'USER_NOT_FOUND')
 * @param statusCode - HTTP status code (e.g., 404, 500)
 */
export class CustomError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly errorCode: ErrorCodes;
  public readonly isOperational: boolean;

  constructor(message: string, errorCode: ErrorCodes, statusCode: HttpStatus) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export const errorHandler = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let statusCode: HttpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message: string = 'Internal Server Error';
  let errorCode: ErrorCodes = errorCodes.INTERNAL_SERVER_ERROR;

  // Handle CustomError instances
  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
  } else {
    message = err.message || message;

    if (err.name === 'ValidationError') {
      statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
      errorCode = errorCodes.VALIDATION_ERROR;
    }

    if (err.name === 'CastError') {
      statusCode = HTTP_STATUS.BAD_REQUEST;
      errorCode = errorCodes.INVALID_ID;
      message = 'Invalid resource ID format';
    }

    if ((err as any).code === 11000) {
      statusCode = HTTP_STATUS.CONFLICT;
      errorCode = errorCodes.DUPLICATE_RESOURCE;
      const field = Object.keys((err as any).keyValue || {})[0];
      message = field ? `${field} already exists` : 'Duplicate resource';
    }

    if (err.name === 'JsonWebTokenError') {
      statusCode = HTTP_STATUS.UNAUTHORIZED;
      errorCode = errorCodes.INVALID_TOKEN;
      message = 'Invalid authentication token';
    }

    if (err.name === 'TokenExpiredError') {
      statusCode = HTTP_STATUS.UNAUTHORIZED;
      errorCode = errorCodes.TOKEN_EXPIRED;
      message = 'Authentication token has expired';
    }
  }

  if (config.nodeEnv === 'development') {
    console.error('\n🔴 Error:', {
      errorCode,
      statusCode,
      message,
      stack: err.stack,
    });
  }

  const response: {
    success: boolean;
    statusCode: HttpStatus;
    errorCode: string;
    message: string;
    stack?: string;
  } = {
    success: false,
    statusCode,
    errorCode,
    message,
  };

  // Include stack trace in development only
  if (config.nodeEnv === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default CustomError;
