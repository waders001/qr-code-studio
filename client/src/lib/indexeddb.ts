import { useState, useEffect } from 'react';

interface QRRecord {
  id?: string;
  contentType: string;
  content: string;
  qrData: string;
  customization: any;
  timestamp: number;
}

interface AnalyticsEvent {
  id?: string;
  eventType: string;
  contentType?: string;
  exportFormat?: string;
  timestamp: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbName = 'QRCodeStudio';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // QR Codes store
        if (!db.objectStoreNames.contains('qrCodes')) {
          const qrStore = db.createObjectStore('qrCodes', { keyPath: 'id', autoIncrement: true });
          qrStore.createIndex('timestamp', 'timestamp', { unique: false });
          qrStore.createIndex('contentType', 'contentType', { unique: false });
        }

        // Analytics store
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
          analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
          analyticsStore.createIndex('eventType', 'eventType', { unique: false });
        }
      };
    });
  }

  async saveQR(qr: QRRecord): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['qrCodes'], 'readwrite');
      const store = transaction.objectStore('qrCodes');
      const request = store.add({ ...qr, timestamp: Date.now() });

      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error);
    });
  }

  async getHistory(limit = 50): Promise<QRRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['qrCodes'], 'readonly');
      const store = transaction.objectStore('qrCodes');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      
      const results: QRRecord[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearHistory(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['qrCodes'], 'readwrite');
      const store = transaction.objectStore('qrCodes');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async trackEvent(eventType: string, contentType?: string, exportFormat?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const event: AnalyticsEvent = {
      eventType,
      contentType,
      exportFormat,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analytics'], 'readwrite');
      const store = transaction.objectStore('analytics');
      const request = store.add(event);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAnalytics(days = 30): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    const [qrCodes, events] = await Promise.all([
      this.getQRCodesAfter(cutoffTime),
      this.getEventsAfter(cutoffTime)
    ]);

    const weekCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weeklyQRCodes = qrCodes.filter(qr => qr.timestamp >= weekCutoff);

    const typeDistribution: Record<string, number> = {};
    qrCodes.forEach(qr => {
      typeDistribution[qr.contentType] = (typeDistribution[qr.contentType] || 0) + 1;
    });

    const downloadStats: Record<string, number> = {};
    events.filter(e => e.eventType === 'download').forEach(event => {
      const format = event.exportFormat || 'unknown';
      downloadStats[format] = (downloadStats[format] || 0) + 1;
    });

    return {
      totalQRCodes: qrCodes.length,
      weeklyCount: weeklyQRCodes.length,
      typeDistribution,
      recentActivity: events.slice(-10).reverse(),
      downloadStats,
    };
  }

  private async getQRCodesAfter(timestamp: number): Promise<QRRecord[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['qrCodes'], 'readonly');
      const store = transaction.objectStore('qrCodes');
      const index = store.index('timestamp');
      const range = IDBKeyRange.lowerBound(timestamp);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getEventsAfter(timestamp: number): Promise<AnalyticsEvent[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analytics'], 'readonly');
      const store = transaction.objectStore('analytics');
      const index = store.index('timestamp');
      const range = IDBKeyRange.lowerBound(timestamp);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export function useIndexedDB() {
  const [dbManager] = useState(() => new IndexedDBManager());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    dbManager.init().then(() => setIsReady(true));
  }, [dbManager]);

  const saveQR = async (qr: QRRecord) => {
    if (!isReady) throw new Error('Database not ready');
    return dbManager.saveQR(qr);
  };

  const getHistory = async (limit?: number) => {
    if (!isReady) return [];
    return dbManager.getHistory(limit);
  };

  const clearHistory = async () => {
    if (!isReady) throw new Error('Database not ready');
    return dbManager.clearHistory();
  };

  const trackEvent = async (eventType: string, contentType?: string, exportFormat?: string) => {
    if (!isReady) return;
    return dbManager.trackEvent(eventType, contentType, exportFormat);
  };

  const getAnalytics = async (days?: number) => {
    if (!isReady) return null;
    return dbManager.getAnalytics(days);
  };

  return {
    isReady,
    saveQR,
    getHistory,
    clearHistory,
    trackEvent,
    getAnalytics,
  };
}
