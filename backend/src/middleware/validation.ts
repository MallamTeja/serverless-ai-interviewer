import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from './errorHandler.js';
import { ApiResponse } from '../models/candidateModel.js';

// Extract validation errors and format them
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => 
      `${error.param}: ${error.msg}`
    ).join(', ');
    
    const response: ApiResponse = {
      success: false,
      error: `Validation failed: ${errorMessages}`,
      code: 'VALIDATION_ERROR',
      message: 'Please check your input and try again'
    };
    
    return res.status(400).json(response);
  }
  
  next();
};

// Common validation rules
export const emailValidation = () =>
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail();

export const phoneValidation = () =>
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number');

export const nameValidation = () =>
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces');

export const idValidation = () =>
  param('id')
    .isUUID()
    .withMessage('Please provide a valid ID');

export const paginationValidation = () => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sortBy')
    .optional()
    .isIn(['name', 'email', 'createdAt', 'updatedAt', 'finalScore'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
];

// Interview validation
export const questionGenerationValidation = () => [
  body('jobRole')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Job role must be between 2 and 100 characters'),
  body('experienceLevel')
    .optional()
    .isIn(['Entry-level', 'Mid-level', 'Senior', 'Lead'])
    .withMessage('Invalid experience level'),
  body('techStack')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Tech stack must be an array of 1-10 items'),
  body('techStack.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tech stack item must be between 1 and 50 characters')
];

export const answerSubmissionValidation = () => [
  body('sessionId')
    .isUUID()
    .withMessage('Please provide a valid session ID'),
  body('answers')
    .isArray({ min: 1, max: 10 })
    .withMessage('Answers must be an array of 1-10 items'),
  body('answers.*.questionId')
    .isUUID()
    .withMessage('Each answer must have a valid question ID'),
  body('answers.*.text')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Each answer must be between 10 and 5000 characters'),
  body('answers.*.submittedAt')
    .isISO8601()
    .withMessage('Each answer must have a valid submission timestamp')
];

// File upload validation
export const fileUploadValidation = () => [
  body('candidateId')
    .optional()
    .isUUID()
    .withMessage('Candidate ID must be a valid UUID if provided')
];

// Candidate validation
export const candidateCreationValidation = () => [
  nameValidation(),
  emailValidation(),
  phoneValidation(),
  body('status')
    .optional()
    .isIn(['pending', 'interviewed', 'rejected', 'hired'])
    .withMessage('Invalid candidate status')
];

export const candidateUpdateValidation = () => [
  idValidation(),
  body('name').optional().trim().isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail()
    .withMessage('Please provide a valid email address'),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('status').optional().isIn(['pending', 'interviewed', 'rejected', 'hired'])
    .withMessage('Invalid candidate status')
];

// File validation helper
export const validateFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    const response: ApiResponse = {
      success: false,
      error: 'No file uploaded',
      code: 'FILE_REQUIRED',
      message: 'Please select a file to upload'
    };
    return res.status(400).json(response);
  }

  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (!allowedMimes.includes(req.file.mimetype)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid file type. Only PDF and DOCX files are allowed.',
      code: 'INVALID_FILE_TYPE',
      message: 'Please upload a PDF or DOCX file'
    };
    return res.status(400).json(response);
  }

  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
  if (req.file.size > maxSize) {
    const response: ApiResponse = {
      success: false,
      error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB.`,
      code: 'FILE_TOO_LARGE',
      message: 'Please upload a smaller file'
    };
    return res.status(400).json(response);
  }

  next();
};

// Rate limiting validation
export const validateRateLimit = (
  windowMs: number,
  max: number,
  message: string = 'Too many requests'
) => {
  const requests = new Map();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    const recentRequests = userRequests.filter((timestamp: number) => timestamp > windowStart);
    
    if (recentRequests.length >= max) {
      const response: ApiResponse = {
        success: false,
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Please try again later'
      };
      return res.status(429).json(response);
    }
    
    recentRequests.push(now);
    requests.set(key, recentRequests);
    
    next();
  };
};

// Custom validation chain builder
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    for (let validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) {
        break;
      }
    }
    
    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => {
        return {
          field: error.param,
          message: error.msg,
          value: error.value
        };
      });
      
      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: 'Please correct the following errors and try again',
        data: { errors: errorMessages }
      };
      
      return res.status(400).json(response);
    }
    
    next();
  };
};

// Sanitize input helper
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potentially dangerous characters
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};