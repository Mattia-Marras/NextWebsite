import { Router } from "express";
import { db, matchesTable, teamsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { serializeTeam } from "./teams";
import { GetStandingsQueryParams, GetStatsSummaryQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/standings", async (req, res) => {
  const qp = GetStandingsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const teamConditions = [];
  if (qp.data.server) teamConditions.push(eq(teamsTable.server, qp.data.server));
  if (qp.data.league) teamConditions.push(eq(teamsTable.league, qp.data.league));

  const teams = await db
    .select()
    .from(teamsTable)
    .where(teamConditions.length > 0 ? and(...teamConditions) : undefined);

  const matchConditions = [eq(matchesTable.status, "finished")];
  if (qp.data.server) matchConditions.push(eq(matchesTable.server, qp.data.server));
  if (qp.data.league) matchConditions.push(eq(matchesTable.league, qp.data.league));

  const matches = await db
    .select()
    .from(matchesTable)
    .where(and(...matchConditions));

  const teamIdSet = new Set(teams.map((t) => t.id));

  const stats: Record<
    number,
    {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
      recentResults: string[];
    }
  > = {};

  for (const team of teams) {
    stats[team.id] = {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      recentResults: [],
    };
  }

  const sortedMatches = [...matches].sort(
    (a, b) => b.matchDate.getTime() - a.matchDate.getTime()
  );

  for (const match of sortedMatches) {
    if (match.homeScore === null || match.awayScore === null) continue;
    if (!teamIdSet.has(match.homeTeamId) || !teamIdSet.has(match.awayTeamId)) continue;

    const home = stats[match.homeTeamId];
    const away = stats[match.awayTeamId];
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
      if (home.recentResults.length < 5) home.recentResults.unshift("W");
      if (away.recentResults.length < 5) away.recentResults.unshift("L");
    } else if (match.homeScore < match.awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
      if (away.recentResults.length < 5) away.recentResults.unshift("W");
      if (home.recentResults.length < 5) home.recentResults.unshift("L");
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
      if (home.recentResults.length < 5) home.recentResults.unshift("D");
      if (away.recentResults.length < 5) away.recentResults.unshift("D");
    }
  }

  const standings = teams
    .map((team) => {
      const s = stats[team.id]!;
      return {
        teamId: team.id,
        team: serializeTeam(team),
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDifference: s.goalsFor - s.goalsAgainst,
        points: s.points,
        form: s.recentResults.join(""),
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

  res.json(standings);
});

router.get("/stats/summary", async (req, res) => {
  const qp = GetStatsSummaryQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const teamConditions = [];
  if (qp.data.server) teamConditions.push(eq(teamsTable.server, qp.data.server));
  if (qp.data.league) teamConditions.push(eq(teamsTable.league, qp.data.league));

  const teams = await db
    .select()
    .from(teamsTable)
    .where(teamConditions.length > 0 ? and(...teamConditions) : undefined);

  const matchConditions = [];
  if (qp.data.server) matchConditions.push(eq(matchesTable.server, qp.data.server));
  if (qp.data.league) matchConditions.push(eq(matchesTable.league, qp.data.league));

  const allMatches = await db
    .select()
    .from(matchesTable)
    .where(matchConditions.length > 0 ? and(...matchConditions) : undefined);

  const finished = allMatches.filter((m) => m.status === "finished");
  const upcoming = allMatches.filter((m) => m.status === "scheduled");

  const totalGoals = finished.reduce((sum, m) => {
    return sum + (m.homeScore ?? 0) + (m.awayScore ?? 0);
  }, 0);

  res.json({
    totalMatches: allMatches.length,
    totalGoals,
    matchesPlayed: finished.length,
    upcomingCount: upcoming.length,
    teamsCount: teams.length,
    topScorer: null,
  });
});

export default router;
