import { Router } from "express";
import { GetStandingsQueryParams, GetStatsSummaryQueryParams } from "@workspace/api-zod";
import {
  listOfficialMatches,
  listOfficialTeams,
  type LeagueSlug,
} from "../lib/nextfb/competition";

const router = Router();

function slug(value: string | undefined): LeagueSlug | undefined {
  return value === "main" || value === "lower" ? value : undefined;
}

router.get("/standings", async (req, res, next) => {
  try {
    const qp = GetStandingsQueryParams.safeParse(req.query);
    if (!qp.success) return void res.status(400).json({ error: "Invalid query params" });
    if (qp.data.server === "blockball") return void res.json([]);

    const league = slug(qp.data.league) ?? "main";
    const [teams, matches] = await Promise.all([
      listOfficialTeams(league),
      listOfficialMatches({ slug: league, status: "finished" }),
    ]);

    const stats = new Map(teams.map((team) => [team.id, {
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, points: 0,
      recentResults: [] as string[],
    }]));

    for (const match of matches) {
      if (match.homeScore === null || match.awayScore === null) continue;
      const home = stats.get(match.homeTeamId);
      const away = stats.get(match.awayTeamId);
      if (!home || !away) continue;
      home.played += 1; away.played += 1;
      home.goalsFor += match.homeScore; home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore; away.goalsAgainst += match.homeScore;
      if (match.homeScore > match.awayScore) {
        home.won += 1; home.points += 3; away.lost += 1;
        if (home.recentResults.length < 5) home.recentResults.push("W");
        if (away.recentResults.length < 5) away.recentResults.push("L");
      } else if (match.homeScore < match.awayScore) {
        away.won += 1; away.points += 3; home.lost += 1;
        if (away.recentResults.length < 5) away.recentResults.push("W");
        if (home.recentResults.length < 5) home.recentResults.push("L");
      } else {
        home.drawn += 1; away.drawn += 1; home.points += 1; away.points += 1;
        if (home.recentResults.length < 5) home.recentResults.push("D");
        if (away.recentResults.length < 5) away.recentResults.push("D");
      }
    }

    const standings = teams.map((team) => {
      const s = stats.get(team.id)!;
      return {
        teamId: team.id, team,
        played: s.played, won: s.won, drawn: s.drawn, lost: s.lost,
        goalsFor: s.goalsFor, goalsAgainst: s.goalsAgainst,
        goalDifference: s.goalsFor - s.goalsAgainst,
        points: s.points, form: s.recentResults.join(""),
      };
    }).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);

    res.json(standings);
  } catch (error) { next(error); }
});

router.get("/stats/summary", async (req, res, next) => {
  try {
    const qp = GetStatsSummaryQueryParams.safeParse(req.query);
    if (!qp.success) return void res.status(400).json({ error: "Invalid query params" });
    if (qp.data.server === "blockball") {
      return void res.json({ totalMatches: 0, totalGoals: 0, matchesPlayed: 0, upcomingCount: 0, teamsCount: 0, topScorer: null });
    }
    const league = slug(qp.data.league) ?? "main";
    const [teams, matches] = await Promise.all([listOfficialTeams(league), listOfficialMatches({ slug: league })]);
    const finished = matches.filter((match) => match.status === "finished");
    res.json({
      totalMatches: matches.length,
      totalGoals: finished.reduce((sum, match) => sum + (match.homeScore ?? 0) + (match.awayScore ?? 0), 0),
      matchesPlayed: finished.length,
      upcomingCount: matches.filter((match) => match.status === "scheduled").length,
      teamsCount: teams.length,
      topScorer: null,
    });
  } catch (error) { next(error); }
});

export default router;
