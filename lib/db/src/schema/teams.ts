import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const teamsTable = pgTable(
  "teams",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    server: text("server").notNull().default("football"),
    league: text("league").notNull().default("main"),
    primaryColor: text("primary_color").notNull().default("#39ff14"),
    secondaryColor: text("secondary_color").notNull().default("#000000"),
    logoInitials: text("logo_initials").notNull(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    // Fast lookup by server+league (most common filter)
    index("teams_server_league_idx").on(t.server, t.league),
    // Alphabetical name searches
    index("teams_name_idx").on(t.name),
  ],
);

export const insertTeamSchema = createInsertSchema(teamsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateTeamSchema = createUpdateSchema(teamsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teamsTable.$inferSelect;
