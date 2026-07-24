import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

export const matchesTable = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    // FK with restrict: can't delete a team that has matches
    homeTeamId: integer("home_team_id")
      .notNull()
      .references(() => teamsTable.id, { onDelete: "restrict" }),
    awayTeamId: integer("away_team_id")
      .notNull()
      .references(() => teamsTable.id, { onDelete: "restrict" }),
    server: text("server").notNull().default("football"),
    league: text("league").notNull().default("main"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    matchDate: timestamp("match_date").notNull(),
    // scheduled | live | finished
    status: text("status").notNull().default("scheduled"),
    round: text("round").notNull(),
    venue: text("venue"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    // Primary filter: server + league + status
    index("matches_server_league_status_idx").on(t.server, t.league, t.status),
    // Date-ordered queries (fixtures, results)
    index("matches_date_idx").on(t.matchDate),
    // Team lookup (fixtures for a specific team)
    index("matches_home_team_idx").on(t.homeTeamId),
    index("matches_away_team_idx").on(t.awayTeamId),
    // Status filter alone
    index("matches_status_idx").on(t.status),
  ],
);

export const insertMatchSchema = createInsertSchema(matchesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateMatchSchema = createUpdateSchema(matchesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;
