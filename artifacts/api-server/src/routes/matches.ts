import { Router } from "express";
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
import {
  createOfficialMatch,
  deleteOfficialMatch,
  getOfficialMatch,
  listOfficialMatches,
  updateOfficialMatch,
  type LeagueSlug,
  type MatchStatus,
} from "../lib/nextfb/competition";

const router = Router();

function slug(value: string | undefined): LeagueSlug | undefined {
  return value === "main" || value === "lower" ? value : undefined;
}

function rejectBlockball(server: string | undefined, res: any): boolean {
  if (server === "blockball") {
    res.json([]);
    return true;
  }
  return false;
}

router.get("/matches", async (req, res, next) => {
  try {
    const qp = ListMatchesQueryParams.safeParse(req.query);
    if (!qp.success) return void res.status(400).json({ error: "Invalid query params" });
    if (rejectBlockball(qp.data.server, res)) return;
    res.json(await listOfficialMatches({ slug: slug(qp.data.league), status: qp.data.status as MatchStatus | undefined }));
  } catch (error) { next(error); }
});

router.get("/matches/recent", async (req, res, next) => {
  try {
    const qp = ListRecentMatchesQueryParams.safeParse(req.query);
    if (!qp.success) return void res.status(400).json({ error: "Invalid query params" });
    if (rejectBlockball(qp.data.server, res)) return;
    res.json(await listOfficialMatches({ slug: slug(qp.data.league), status: "finished", limit: 10 }));
  } catch (error) { next(error); }
});

router.get("/matches/upcoming", async (req, res, next) => {
  try {
    const qp = ListUpcomingMatchesQueryParams.safeParse(req.query);
    if (!qp.success) return void res.status(400).json({ error: "Invalid query params" });
    if (rejectBlockball(qp.data.server, res)) return;
    res.json(await listOfficialMatches({ slug: slug(qp.data.league), status: "scheduled", limit: 10, ascending: true }));
  } catch (error) { next(error); }
});

router.post("/matches", async (req, res, next) => {
  try {
    const parsed = CreateMatchBody.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: parsed.error.message });
    if (parsed.data.server !== "football") {
      return void res.status(400).json({ error: "Only NEXT Football is connected to an official competition database right now" });
    }
    const league = slug(parsed.data.league);
    if (!league) return void res.status(400).json({ error: "Invalid league" });
    const match = await createOfficialMatch({
      homeTeamId: parsed.data.homeTeamId,
      awayTeamId: parsed.data.awayTeamId,
      league,
      homeScore: parsed.data.homeScore ?? null,
      awayScore: parsed.data.awayScore ?? null,
      matchDate: new Date(parsed.data.matchDate),
      status: (parsed.data.status ?? "scheduled") as MatchStatus,
      round: parsed.data.round,
      venue: parsed.data.venue ?? null,
    });
    res.status(201).json(match);
  } catch (error) { next(error); }
});

router.get("/matches/:id", async (req, res, next) => {
  try {
    const params = GetMatchParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) return void res.status(400).json({ error: "Invalid id" });
    const match = await getOfficialMatch(params.data.id);
    if (!match) return void res.status(404).json({ error: "Match not found" });
    res.json(match);
  } catch (error) { next(error); }
});

router.patch("/matches/:id", async (req, res, next) => {
  try {
    const params = UpdateMatchParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) return void res.status(400).json({ error: "Invalid id" });
    const parsed = UpdateMatchBody.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: parsed.error.message });
    const data = parsed.data;
    const match = await updateOfficialMatch(params.data.id, {
      ...(data.homeScore !== undefined ? { homeScore: data.homeScore } : {}),
      ...(data.awayScore !== undefined ? { awayScore: data.awayScore } : {}),
      ...(data.matchDate !== undefined ? { matchDate: new Date(data.matchDate) } : {}),
      ...(data.status !== undefined ? { status: data.status as MatchStatus } : {}),
      ...(data.round !== undefined ? { round: data.round } : {}),
      ...(data.venue !== undefined ? { venue: data.venue } : {}),
    });
    if (!match) return void res.status(404).json({ error: "Match not found" });
    res.json(match);
  } catch (error) { next(error); }
});

router.delete("/matches/:id", async (req, res, next) => {
  try {
    const params = DeleteMatchParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) return void res.status(400).json({ error: "Invalid id" });
    if (!(await deleteOfficialMatch(params.data.id))) return void res.status(404).json({ error: "Match not found" });
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
