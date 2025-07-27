import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Rate limiter for QR creation API
export const qrCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many QR codes created from this IP, please try again after a minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many QR codes created from this IP, please try again after a minute.'
    });
  }
});

// Rate limiter for analytics API
export const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // higher limit for analytics
  message: {
    error: 'Too many analytics requests from this IP, please try again after a minute.'
  }
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    // Recursively sanitize all string inputs
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        // Remove potential script tags and dangerous characters
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .substring(0, 10000); // Limit string length
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          // Sanitize key names too
          const cleanKey = key.replace(/[^\w\-_]/g, '').substring(0, 100);
          sanitized[cleanKey] = sanitizeObject(value);
        }
        return sanitized;
      }
      
      return obj;
    };

    req.body = sanitizeObject(req.body);
  }
  
  next();
};

// Validate share ID format
export const validateShareId = (shareId: string): boolean => {
  // Share IDs should be alphanumeric, 6-24 characters
  const shareIdRegex = /^[a-zA-Z0-9]{6,24}$/;
  return shareIdRegex.test(shareId);
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; '));
  
  next();
};

// CORS configuration
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://qr-genius.vercel.app', 'https://qr-genius.com']
    : ['http://localhost:5000', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};