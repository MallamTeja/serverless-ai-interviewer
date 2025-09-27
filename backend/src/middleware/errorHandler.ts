import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../models/candidateModel.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error types
export class ValidationError extends CustomError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class FileUploadError extends CustomError {
  constructor(message: string) {
    super(message, 400, 'FILE_UPLOAD_ERROR');
  }
}

export class ExternalServiceError extends CustomError {
  constructor(message: string, service: string = 'External Service') {
    super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR');
  }
}

// Development error details (includes stack trace)
const sendErrorDev = (err: AppError, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: err.message,
    code: err.code || 'INTERNAL_ERROR',
    message: 'An error occurred during development'
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (response as any).stack = err.stack;
    (response as any).details = {
      name: err.name,
      statusCode: err.statusCode
    };
  }

  res.status(err.statusCode || 500).json(response);
};

// Production error details (clean, user-friendly)
const sendErrorProd = (err: AppError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
      code: err.code || 'OPERATION_ERROR',
      message: 'Request could not be processed'
    };
    
    res.status(err.statusCode || 500).json(response);
  } else {
    // Programming or unknown error: don't leak error details
    console.error('ERROR:', err);
    
    const response: ApiResponse = {
      success: false,
      error: 'Something went wrong on our end. Please try again later.',
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    };
    
    res.status(500).json(response);
  }
};

// Handle specific error types
const handleCastErrorDB = (err: any): CustomError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ValidationError(message);
};

const handleDuplicateFieldsDB = (err: any): CustomError => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new ConflictError(message);
};

const handleValidationErrorDB = (err: any): CustomError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ValidationError(message);
};

const handleJWTError = (): CustomError =>
  new UnauthorizedError('Invalid token. Please log in again!');

const handleJWTExpiredError = (): CustomError =>
  new UnauthorizedError('Your token has expired! Please log in again.');

// Main error handling middleware
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// Async error wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new NotFoundError(`Can't find ${req.originalUrl} on this server!`);
  next(err);
};

// Graceful shutdown handler
export const gracefulShutdown = (server: any) => {
  return (signal: string) => {
    console.log(`Received ${signal}. Graceful shutdown initiated...`);
    
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };
};

// Handle uncaught exceptions
export const handleUncaughtException = () => {
  process.on('uncaughtException', (err: Error) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });
};

// Handle unhandled promise rejections
export const handleUnhandledRejection = (server: any) => {
  process.on('unhandledRejection', (err: Error) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
};