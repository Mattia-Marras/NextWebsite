import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Key-value store for site-wide settings (minecraftIp, discordUrl, etc.)
// Each row is one setting — `key` is unique, `id` is the surrogate PK.
export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Setting = typeof settingsTable.$inferSelect;
