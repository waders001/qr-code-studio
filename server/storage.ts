import { type QRCode, type InsertQRCode, type Analytics, type InsertAnalytics } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // QR Code operations
  createQRCode(qr: InsertQRCode): Promise<QRCode>;
  getQRCodeByShareId(shareId: string): Promise<QRCode | undefined>;
  getRecentQRCodes(limit?: number): Promise<QRCode[]>;
  
  // Analytics operations
  trackEvent(event: InsertAnalytics): Promise<Analytics>;
  getAnalytics(days?: number): Promise<{
    totalQRCodes: number;
    weeklyCount: number;
    typeDistribution: Record<string, number>;
    recentActivity: Analytics[];
    downloadStats: Record<string, number>;
  }>;
}

export class MemStorage implements IStorage {
  private qrCodes: Map<string, QRCode>;
  private analytics: Analytics[];

  constructor() {
    this.qrCodes = new Map();
    this.analytics = [];
  }

  async createQRCode(insertQR: InsertQRCode): Promise<QRCode> {
    const id = randomUUID();
    const shareId = this.generateShareId();
    const qr: QRCode = {
      ...insertQR,
      id,
      shareId,
      createdAt: new Date(),
    };
    this.qrCodes.set(id, qr);
    
    // Track creation event
    await this.trackEvent({
      eventType: 'create',
      contentType: qr.contentType,
      metadata: { shareId }
    });
    
    return qr;
  }

  async getQRCodeByShareId(shareId: string): Promise<QRCode | undefined> {
    return Array.from(this.qrCodes.values()).find(qr => qr.shareId === shareId);
  }

  async getRecentQRCodes(limit: number = 20): Promise<QRCode[]> {
    return Array.from(this.qrCodes.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async trackEvent(insertEvent: InsertAnalytics): Promise<Analytics> {
    const event: Analytics = {
      ...insertEvent,
      id: randomUUID(),
      timestamp: new Date(),
    };
    this.analytics.push(event);
    return event;
  }

  async getAnalytics(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentEvents = this.analytics.filter(event => event.timestamp >= cutoffDate);
    const recentQRCodes = Array.from(this.qrCodes.values()).filter(qr => qr.createdAt >= cutoffDate);
    
    const weekCutoff = new Date();
    weekCutoff.setDate(weekCutoff.getDate() - 7);
    const weeklyQRCodes = Array.from(this.qrCodes.values()).filter(qr => qr.createdAt >= weekCutoff);
    
    const typeDistribution: Record<string, number> = {};
    recentQRCodes.forEach(qr => {
      typeDistribution[qr.contentType] = (typeDistribution[qr.contentType] || 0) + 1;
    });
    
    const downloadStats: Record<string, number> = {};
    recentEvents.filter(e => e.eventType === 'download').forEach(event => {
      const format = event.exportFormat || 'unknown';
      downloadStats[format] = (downloadStats[format] || 0) + 1;
    });
    
    return {
      totalQRCodes: this.qrCodes.size,
      weeklyCount: weeklyQRCodes.length,
      typeDistribution,
      recentActivity: recentEvents.slice(-10).reverse(),
      downloadStats,
    };
  }

  private generateShareId(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}

export const storage = new MemStorage();
