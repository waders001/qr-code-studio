import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertQRCodeSchema, insertAnalyticsSchema } from "@shared/schema";

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply security headers to all routes
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Input sanitization middleware
  const sanitizeInput = (req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      const sanitizeString = (str: string) => {
        return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                 .replace(/javascript:/gi, '')
                 .substring(0, 10000);
      };
      
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeString(req.body[key]);
        }
      });
    }
    next();
  };

  // Rate limiter for QR creation
  const qrRateLimit = (req: any, res: any, next: any) => {
    const rateLimitStore = new Map();
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10;
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = rateLimitStore.get(key);
    if (now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
    
    record.count++;
    next();
  };

  // Create a new QR code and return shareable link
  app.post("/api/qr", qrRateLimit, sanitizeInput, async (req, res) => {
    try {
      const data = insertQRCodeSchema.parse(req.body);
      const qrCode = await storage.createQRCode(data);
      res.json({ qrCode, shareUrl: `/qr/${qrCode.shareId}` });
    } catch (error) {
      res.status(400).json({ error: "Invalid QR code data" });
    }
  });

  // Get QR code by share ID
  app.get("/api/qr/:shareId", async (req, res) => {
    try {
      const shareId = req.params.shareId;
      
      // Validate share ID format
      if (!/^[a-zA-Z0-9]{6,24}$/.test(shareId)) {
        return res.status(400).json({ error: "Invalid share ID format" });
      }
      
      const qrCode = await storage.getQRCodeByShareId(shareId);
      if (!qrCode) {
        return res.status(404).json({ error: "QR code not found" });
      }
      
      // Track view event
      await storage.trackEvent({
        eventType: 'view',
        contentType: qrCode.contentType,
        metadata: { shareId: qrCode.shareId }
      });
      
      res.json(qrCode);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve QR code" });
    }
  });

  // Get recent QR codes
  app.get("/api/qr", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const qrCodes = await storage.getRecentQRCodes(limit);
      res.json(qrCodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve QR codes" });
    }
  });

  // Upload logo for QR code overlay
  app.post("/api/upload-logo", upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // In a real app, you'd upload to cloud storage and return the URL
      const logoUrl = `/uploads/${req.file.filename}`;
      res.json({ logoUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload logo" });
    }
  });

  // Track analytics events
  app.post("/api/analytics", async (req, res) => {
    try {
      const data = insertAnalyticsSchema.parse(req.body);
      const event = await storage.trackEvent(data);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid analytics data" });
    }
  });

  // Get analytics dashboard data
  app.get("/api/analytics", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const analytics = await storage.getAnalytics(days);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve analytics" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);
  return httpServer;
}
