import { Router } from "express";
import { db, teamsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateTeamBody, UpdateTeamBody, GetTeamParams, UpdateTeamParams, DeleteTeamParams, ListTeamsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/teams", async (req, res) => {
  const qp = ListTeamsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const conditions = [];
  if (qp.data.server) conditions.push(eq(teamsTable.server, qp.data.server));
  if (qp.data.league) conditions.push(eq(teamsTable.league, qp.data.league));

  const teams = await db
    .select()
    .from(teamsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(teamsTable.name);

  res.json(teams.map(serializeTeam));
});

router.post("/teams", async (req, res) => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [team] = await db.insert(teamsTable).values(parsed.data).returning();
  res.status(201).json(serializeTeam(team));
});

router.get("/teams/:id", async (req, res) => {
  const params = GetTeamParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.id));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  res.json(serializeTeam(team));
});

router.patch("/teams/:id", async (req, res) => {
  const params = UpdateTeamParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [team] = await db.update(teamsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(teamsTable.id, params.data.id)).returning();
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  res.json(serializeTeam(team));
});

router.delete("/teams/:id", async (req, res) => {
  const params = DeleteTeamParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [deleted] = await db.delete(teamsTable).where(eq(teamsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  res.status(204).send();
});

export function serializeTeam(team: typeof teamsTable.$inferSelect) {
  return {
    id: team.id,
    name: team.name,
    shortName: team.shortName,
    server: team.server,
    league: team.league,
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
    logoInitials: team.logoInitials,
    logoUrl: team.logoUrl,
    createdAt: team.createdAt.toISOString(),
  };
}

export default router;
