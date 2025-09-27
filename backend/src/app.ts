import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import interviewRouter from './routes/interview';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || false
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/interview', interviewRouter);

// Serve frontend static files
const frontendPath = path.join(__dirname, '../../frontend/dist');
const fs = require('fs');

// Only serve static files if frontend build exists
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  console.log(`📁 Serving frontend from: ${frontendPath}`);
} else {
  console.log(`⚠️  Frontend build not found at: ${frontendPath}`);
  console.log(`📝 Run 'npm run build' in frontend directory to build the frontend`);
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Handle client-side routing - serve index.html for all non-API routes
app.get(/^(?!\/api).*/, (req: Request, res: Response) => {
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      success: false,
      message: 'Frontend not built yet',
      error: {
        code: 'FRONTEND_NOT_BUILT',
        suggestion: 'Run "npm run build" in the frontend directory to build the React app',
      },
    });
  }
});

// Global error handler
interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message || 'Something went wrong';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    status = 'fail';
    message = 'Invalid input data';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    status = 'fail';
    message = 'Invalid data format';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    message = 'Token has expired';
  }

  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    status,
    message,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    errorResponse.error = err;
  } else {
    // In production, only send generic message for 500 errors
    if (statusCode === 500) {
      errorResponse.message = 'Internal server error';
    }
  }

  res.status(statusCode).json(errorResponse);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
