import { Request, Response, NextFunction } from 'express';
import Boom from '@hapi/boom';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { ZodError } from 'zod';

interface ApiError extends Error {
  status?: number;
  statusCode?: number;
  isBoom?: boolean;
  output?: {
    statusCode: number;
    payload: {
      error: string;
      message: string;
      [key: string]: any;
    };
  };
}

export function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction): void {
  // Already sent response
  if (res.headersSent) {
    next(err);
    return;
  }

  // Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  // SafeModeError mapping to 429/422
  if (err.name === 'SafeModeError') {
    const code = (err as any).code;
    const httpStatus = (code === 'F13' || code === 'F15') ? 422 : 429;
    res.status(httpStatus).json({
      success: false,
      error: 'SafeModeError',
      code: code,
      message: (err as any).detail || err.message,
    });
    return;
  }

  // Boom HTTP errors (structured)
  if (err.isBoom && err.output) {
    const { statusCode, payload } = err.output;
    logger.warn('HTTP error', { statusCode, message: payload.message, path: req.path });
    
    // Construct response, including any custom payload fields like 'code'
    const responsePayload: any = {
      success: false,
      error: payload.error,
      message: payload.message,
    };
    
    if (payload.code) {
      responsePayload.code = payload.code;
    }

    res.status(statusCode).json(responsePayload);
    return;
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue ?? {})[0];
    res.status(409).json({
      success: false,
      error: 'Conflict',
      message: `${field} already exists`,
    });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
    });
    return;
  }

  // Log unexpected errors
  logger.error('Unhandled error', {
    message: err.message,
    stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Never expose stack traces in production
  res.status(err.status ?? err.statusCode ?? 500).json({
    success: false,
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
  });
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
