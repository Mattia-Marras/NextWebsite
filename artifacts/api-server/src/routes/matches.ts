import { Router } from "express";
import { db, matchesTable, teamsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateMatchBody,
  UpdateMatchBody,
  GetMatchParams,
  UpdateMatchParams,
  DeleteMatchParams,
  ListMatchesQueryParams,
  ListRecentMatchesQueryParams,
  ListUpcomingMatchesQueryParams,
} from "@workspace/api-zod";
import { serializeTeam } from "./teams";

const router = Router();

async function getAllTeamsById() {
  const allTeams = await db.select().from(teamsTable);
  return Object.fromEntries(allTeams.map((t) => [t.id, t]));
}

router.get("/matches", async (req, res) => {
  const qp = ListMatchesQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const conditions = [];
  if (qp.data.status) conditions.push(eq(matchesTable.status, qp.data.status));
  if (qp.data.server) conditions.push(eq(matchesTable.server, qp.data.server));
  if (qp.data.league) conditions.push(eq(matchesTable.league, qp.data.league));

  const rows = await db
    .select()
    .from(matchesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(matchesTable.matchDate));

  const teamsById = await getAllTeamsById();
  res.json(rows.map((m) => serializeMatch(m, teamsById)));
});

router.get("/matches/recent", async (req, res) => {
  const qp = ListRecentMatchesQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const conditions = [eq(matchesTable.status, "finished")];
  if (qp.data.server) conditions.push(eq(matchesTable.server, qp.data.server));
  if (qp.data.league) conditions.push(eq(matchesTable.league, qp.data.league));

  const rows = await db
    .select()
    .from(matchesTable)
    .where(and(...conditions))
    .orderBy(desc(matchesTable.matchDate))
    .limit(10);

  const teamsById = await getAllTeamsById();
  res.json(rows.map((m) => serializeMatch(m, teamsById)));
});

router.get("/matches/upcoming", async (req, res) => {
  const qp = ListUpcomingMatchesQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const conditions = [eq(matchesTable.status, "scheduled")];
  if (qp.data.server) conditions.push(eq(matchesTable.server, qp.data.server));
  if (qp.data.league) conditions.push(eq(matchesTable.league, qp.data.league));

  const rows = await db
    .select()
    .from(matchesTable)
    .where(and(...conditions))
    .orderBy(matchesTable.matchDate)
    .limit(10);

  const teamsById = await getAllTeamsById();
  res.json(rows.map((m) => serializeMatch(m, teamsById)));
});

router.post("/matches", async (req, res) => {
  const parsed = CreateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [match] = await db
    .insert(matchesTable)
    .values({
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      server: data.server,
      league: data.league,
      homeScore: data.homeScore ?? null,
      awayScore: data.awayScore ?? null,
      matchDate: new Date(data.matchDate),
      status: data.status ?? "scheduled",
      round: data.round,
      venue: data.venue ?? null,
    })
    .returning();

  const teamsById = await getAllTeamsById();
  res.status(201).json(serializeMatch(match, teamsById));
});

router.get("/matches/:id", async (req, res) => {
  const params = GetMatchParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [match] = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.id, params.data.id));

  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const teamsById = await getAllTeamsById();
  res.json(serializeMatch(match, teamsById));
});

router.patch("/matches/:id", async (req, res) => {
  const params = UpdateMatchParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  const d = parsed.data;
  if (d.homeScore !== undefined) update.homeScore = d.homeScore;
  if (d.awayScore !== undefined) update.awayScore = d.awayScore;
  if (d.status !== undefined) update.status = d.status;
  if (d.round !== undefined) update.round = d.round;
  if (d.venue !== undefined) update.venue = d.venue;
  if (d.matchDate !== undefined) update.matchDate = new Date(d.matchDate);
  if (d.server !== undefined) update.server = d.server;
  if (d.league !== undefined) update.league = d.league;

  const [match] = await db
    .update(matchesTable)
    .set(update)
    .where(eq(matchesTable.id, params.data.id))
    .returning();

  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const teamsById = await getAllTeamsById();
  res.json(serializeMatch(match, teamsById));
});

router.delete("/matches/:id", async (req, res) => {
  const params = DeleteMatchParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(matchesTable)
    .where(eq(matchesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  res.status(204).send();
});

export function serializeMatch(
  match: typeof matchesTable.$inferSelect,
  teamsById: Record<number, typeof teamsTable.$inferSelect>
) {
  return {
    id: match.id,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeTeam: serializeTeam(teamsById[match.homeTeamId]!),
    awayTeam: serializeTeam(teamsById[match.awayTeamId]!),
    server: match.server,
    league: match.league,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    matchDate: match.matchDate.toISOString(),
    status: match.status,
    round: match.round,
    venue: match.venue,
    createdAt: match.createdAt.toISOString(),
  };
}

export default router;
