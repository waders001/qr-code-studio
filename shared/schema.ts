import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const qrCodes = pgTable("qr_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shareId: varchar("share_id").unique().notNull(),
  contentType: text("content_type").notNull(),
  content: text("content").notNull(),
  qrData: text("qr_data").notNull(),
  customization: jsonb("customization").notNull().$type<{
    size: number;
    fgColor: string;
    bgColor: string;
    overlayText?: string;
    logoUrl?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: text("event_type").notNull(), // 'create', 'download', 'share', 'view'
  contentType: text("content_type"), // 'text', 'url', 'vcard', etc.
  exportFormat: text("export_format"), // 'png', 'svg'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
});

export const insertQRCodeSchema = createInsertSchema(qrCodes).omit({
  id: true,
  shareId: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  timestamp: true,
});

export type InsertQRCode = z.infer<typeof insertQRCodeSchema>;
export type QRCode = typeof qrCodes.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;
