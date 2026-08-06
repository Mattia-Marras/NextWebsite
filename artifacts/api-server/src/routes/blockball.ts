import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { queryBlockball } from "../lib/blockball-db";

const router = Router();
const leagues = new Set(["ML", "LL"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RANKS = [
  { name: "BRONZE_1", displayName: "Bronze 1", minimumMmr: 0, maximumMmr: 874 },
  { name: "BRONZE_2", displayName: "Bronze 2", minimumMmr: 875, maximumMmr: 924 },
  { name: "BRONZE_3", displayName: "Bronze 3", minimumMmr: 925, maximumMmr: 974 },
  { name: "IRON_1", displayName: "Iron 1", minimumMmr: 975, maximumMmr: 1024 },
  { name: "IRON_2", displayName: "Iron 2", minimumMmr: 1025, maximumMmr: 1074 },
  { name: "IRON_3", displayName: "Iron 3", minimumMmr: 1075, maximumMmr: 1124 },
  { name: "GOLD_1", displayName: "Gold 1", minimumMmr: 1125, maximumMmr: 1174 },
  { name: "GOLD_2", displayName: "Gold 2", minimumMmr: 1175, maximumMmr: 1224 },
  { name: "GOLD_3", displayName: "Gold 3", minimumMmr: 1225, maximumMmr: 1274 },
  { name: "DIAMOND_1", displayName: "Diamond 1", minimumMmr: 1275, maximumMmr: 1324 },
  { name: "DIAMOND_2", displayName: "Diamond 2", minimumMmr: 1325, maximumMmr: 1374 },
  { name: "DIAMOND_3", displayName: "Diamond 3", minimumMmr: 1375, maximumMmr: 1424 },
  { name: "RUBY_1", displayName: "Ruby 1", minimumMmr: 1425, maximumMmr: 1474 },
  { name: "RUBY_2", displayName: "Ruby 2", minimumMmr: 1475, maximumMmr: 1524 },
  { name: "RUBY_3", displayName: "Ruby 3", minimumMmr: 1525, maximumMmr: 1574 },
  { name: "PLATINUM_1", displayName: "Platinum 1", minimumMmr: 1575, maximumMmr: 1624 },
  { name: "PLATINUM_2", displayName: "Platinum 2", minimumMmr: 1625, maximumMmr: 1674 },
  { name: "PLATINUM_3", displayName: "Platinum 3", minimumMmr: 1675, maximumMmr: 1724 },
  { name: "LEGEND_1", displayName: "Legend 1", minimumMmr: 1725, maximumMmr: 1774 },
  { name: "LEGEND_2", displayName: "Legend 2", minimumMmr: 1775, maximumMmr: 1824 },
  { name: "LEGEND_3", displayName: "Legend 3", minimumMmr: 1825, maximumMmr: 1874 },
  { name: "MYTHIC_1", displayName: "Mythic 1", minimumMmr: 1875, maximumMmr: null },
] as const;

const RANKED_STATS = [
  "PEAK_MMR",
  "GAMES",
  "WINS",
  "LOSSES",
  "WIN_RATE",
  "WIN_STREAK",
  "LOSS_STREAK",
  "GOALS",
  "ASSISTS",
  "PASSES",
  "SAVES",
] as const;

function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRank(mmrValue: unknown) {
  const mmr = Math.max(0, number(mmrValue));
  return [...RANKS].reverse().find((rank) => mmr >= rank.minimumMmr) ?? RANKS[0];
}

function league(value: unknown) {
  const result = String(value || "").toUpperCase();
  if (!leagues.has(result)) throw new Error("Invalid league");
  return result;
}

function rankedFromPlayer(player: any) {
  const mmr = number(player.mmr);
  const wins = number(player.wins);
  const losses = number(player.losses);
  const games = number(player.games) || wins + losses;
  const storedWinRate = number(player.winrate);
  const winRate = storedWinRate || (games > 0 ? (wins / games) * 100 : 0);

  return {
    mmr,
    peakMmr: number(player.peak_mmr),
    games,
    wins,
    losses,
    winRate,
    winStreak: number(player.winstreak),
    lossStreak: number(player.lossstreak),
    goals: number(player.goals),
    assists: number(player.assists),
    passes: number(player.passes),
    saves: number(player.saves),
    rank: getRank(mmr),
    stats: {
      PEAK_MMR: number(player.peak_mmr),
      GAMES: games,
      WINS: wins,
      LOSSES: losses,
      WIN_RATE: winRate,
      WIN_STREAK: number(player.winstreak),
      LOSS_STREAK: number(player.lossstreak),
      GOALS: number(player.goals),
      ASSISTS: number(player.assists),
      PASSES: number(player.passes),
      SAVES: number(player.saves),
    },
  };
}

async function optionalQuery<T extends RowDataPacket[]>(sql: string, params: any[] = []): Promise<T> {
  try {
    return await queryBlockball<T>(sql, params);
  } catch (error) {
    console.warn("[BlockBall] Optional query failed:", error);
    return [] as unknown as T;
  }
}

async function loadMmrHistory(uuid: string) {
  const rows = await optionalQuery<(RowDataPacket & Record<string, unknown>)[]>(
    `SELECT * FROM elo_history WHERE player_uuid=? LIMIT 500`,
    [uuid],
  );

  return rows.map((row, index) => {
    const rawDate = row.created_at ?? row.createdAt ?? row.timestamp ?? row.date ?? null;
    return {
      id: row.id ?? index + 1,
      mmr: number(row.mmr),
      createdAt: rawDate,
      sequence: index + 1,
      rank: getRank(row.mmr),
    };
  });
}

router.get("/league/:league", async (req, res, next) => {
  try {
    const code = league(req.params.league);
    const teams = await queryBlockball<(RowDataPacket & any)[]>(
      `SELECT * FROM blockball_league_teams WHERE league_code=? ORDER BY sort_order,id`,
      [code],
    );
    const matches = await queryBlockball<(RowDataPacket & any)[]>(
      `SELECT * FROM blockball_league_matches WHERE league_code=? ORDER BY played_at DESC,id DESC`,
      [code],
    );
    const map = new Map(
      teams.map((team) => [
        team.team_name,
        {
          teamId: team.id,
          teamName: team.team_name,
          teamCode: team.team_code,
          logoPath: team.logo_path,
          played: number(team.manual_played),
          won: number(team.manual_won),
          drawn: number(team.manual_drawn),
          lost: number(team.manual_lost),
          goalsFor: number(team.manual_goals_for),
          goalsAgainst: number(team.manual_goals_against),
          points: number(team.manual_points),
        },
      ]),
    );

    for (const match of matches) {
      const home = map.get(match.team1_name);
      const away = map.get(match.team2_name);
      if (!home || !away) continue;
      const homeScore = number(match.score1);
      const awayScore = number(match.score2);
      home.played++;
      away.played++;
      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;
      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;
      if (homeScore > awayScore) {
        home.won++;
        away.lost++;
        home.points += 3;
      } else if (awayScore > homeScore) {
        away.won++;
        home.lost++;
        away.points += 3;
      } else {
        home.drawn++;
        away.drawn++;
        home.points++;
        away.points++;
      }
    }

    const standings = [...map.values()]
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
          b.goalsFor - a.goalsFor ||
          a.teamName.localeCompare(b.teamName),
      )
      .map((row, index) => ({ ...row, position: index + 1, goalDifference: row.goalsFor - row.goalsAgainst }));

    const stats = await queryBlockball<(RowDataPacket & any)[]>(
      `SELECT s.player_uuid uuid,COALESCE(n.name,s.player_name,s.player_uuid) name,s.goals,s.assists,s.saves
       FROM blockball_league_player_stats s
       LEFT JOIN player_names n ON n.uuid=s.player_uuid
       WHERE s.league_code=?`,
      [code],
    );

    const seasons = await optionalQuery<(RowDataPacket & any)[]>(
      `SELECT season_id seasonId,
              MAX(finalized) finalized,
              COUNT(*) players,
              SUM(matches) matches,SUM(goals) goals,SUM(assists) assists,SUM(saves) saves,
              SUM(clean_sheets) cleanSheets,SUM(wins) wins,SUM(draws) draws,SUM(losses) losses
       FROM league_player_season_stats
       WHERE UPPER(league_id)=?
       GROUP BY season_id
       ORDER BY finalized ASC, season_id DESC`,
      [code],
    );

    const requestedSeason = String(req.query.season || "").trim();
    const selectedSeason = requestedSeason || String(seasons[0]?.seasonId || "");
    const [seasonPlayers, seasonAwards] = selectedSeason
      ? await Promise.all([
          optionalQuery<(RowDataPacket & any)[]>(
            `SELECT s.player_uuid uuid,COALESCE(n.name,s.player_uuid) name,
                    s.matches,s.goals,s.assists,s.saves,s.clean_sheets cleanSheets,
                    s.wins,s.draws,s.losses,s.finalized
             FROM league_player_season_stats s
             LEFT JOIN player_names n ON n.uuid=s.player_uuid
             WHERE UPPER(s.league_id)=? AND s.season_id=?
             ORDER BY s.goals DESC,s.assists DESC,s.saves DESC,s.matches DESC`,
            [code, selectedSeason],
          ),
          optionalQuery<(RowDataPacket & any)[]>(
            `SELECT a.id,a.player_uuid uuid,COALESCE(n.name,a.player_uuid) name,
                    a.award_type awardType,a.amount,a.awarded_at awardedAt
             FROM league_player_awards a
             LEFT JOIN player_names n ON n.uuid=a.player_uuid
             WHERE UPPER(a.league_id)=? AND a.season_id=?
             ORDER BY a.award_type,a.amount DESC,name`,
            [code, selectedSeason],
          ),
        ])
      : [[], []];

    const awardTotals = await optionalQuery<(RowDataPacket & any)[]>(
      `SELECT a.award_type awardType,SUM(a.amount) amount,COUNT(DISTINCT a.player_uuid) recipients
       FROM league_player_awards a WHERE UPPER(a.league_id)=?
       GROUP BY a.award_type ORDER BY amount DESC,a.award_type`,
      [code],
    );

    return res.json({
      league: code,
      standings,
      matches: matches.map((match) => ({
        id: match.id,
        team1: match.team1_name,
        team2: match.team2_name,
        score1: number(match.score1),
        score2: number(match.score2),
        matchday: match.matchday,
        playedAt: match.played_at,
      })),
      leaders: {
        goals: [...stats].sort((a, b) => number(b.goals) - number(a.goals)).slice(0, 10),
        assists: [...stats].sort((a, b) => number(b.assists) - number(a.assists)).slice(0, 10),
        saves: [...stats].sort((a, b) => number(b.saves) - number(a.saves)).slice(0, 10),
      },
      history: {
        seasons: seasons.map((row) => ({ ...row, finalized: Boolean(row.finalized) })),
        selectedSeason: selectedSeason || null,
        players: seasonPlayers.map((row) => ({ ...row, uuid: String(row.uuid).toLowerCase(), finalized: Boolean(row.finalized) })),
        awards: seasonAwards.map((row) => ({ ...row, uuid: String(row.uuid).toLowerCase() })),
        awardTotals,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/ranked", async (_req, res, next) => {
  try {
    const players = await queryBlockball<(RowDataPacket & any)[]>(
      `SELECT p.uuid,COALESCE(n.name,p.name,p.uuid) name,
              p.mmr,p.peak_mmr,p.games,p.wins,p.losses,p.winrate,p.winstreak,p.lossstreak,
              p.goals,p.assists,p.passes,p.saves
       FROM players p
       LEFT JOIN player_names n ON n.uuid=p.uuid
       WHERE p.mmr IS NOT NULL
       ORDER BY p.mmr DESC,p.wins DESC,p.losses ASC,p.uuid ASC
       LIMIT 250`,
    );

    const leaderboard = players.map((player, index) => ({
      position: index + 1,
      uuid: String(player.uuid).toLowerCase(),
      name: player.name,
      ...rankedFromPlayer(player),
    }));

    return res.json({ leaderboard, statNames: RANKED_STATS, ranks: RANKS });
  } catch (error) {
    return next(error);
  }
});

router.get("/players/resolve/:name", async (req, res, next) => {
  try {
    const rows = await queryBlockball<(RowDataPacket & { uuid: string; name: string })[]>(
      `SELECT uuid,name FROM player_names WHERE LOWER(name)=LOWER(?) ORDER BY last_seen DESC LIMIT 1`,
      [req.params.name],
    );
    if (!rows[0]) return res.status(404).json({ error: "BLOCKBALL_PLAYER_NOT_FOUND" });
    return res.json({ ...rows[0], uuid: String(rows[0].uuid).toLowerCase() });
  } catch (error) {
    return next(error);
  }
});

router.get("/players", async (_req, res, next) => {
  try {
    const rows = await queryBlockball<(RowDataPacket & any)[]>(
      `SELECT p.uuid,COALESCE(n.name,p.name,p.uuid) name,p.level,p.xp,p.coins,p.mmr
       FROM players p
       LEFT JOIN player_names n ON n.uuid=p.uuid
       ORDER BY p.level DESC,p.xp DESC,p.mmr DESC
       LIMIT 100`,
    );
    return res.json(rows.map((row) => ({ ...row, uuid: String(row.uuid).toLowerCase() })));
  } catch (error) {
    return next(error);
  }
});

router.get("/players/:uuid", async (req, res, next) => {
  try {
    const uuid = String(req.params.uuid).toLowerCase();
    if (!uuidPattern.test(uuid)) return res.status(400).json({ error: "INVALID_UUID" });

    const rows = await queryBlockball<(RowDataPacket & any)[]>(
      `SELECT p.*,COALESCE(n.name,p.name,p.uuid) resolved_name,n.last_seen lastSeen
       FROM players p
       LEFT JOIN player_names n ON n.uuid=p.uuid
       WHERE LOWER(p.uuid)=? LIMIT 1`,
      [uuid],
    );
    const base = rows[0];
    if (!base) return res.status(404).json({ error: "BLOCKBALL_PLAYER_NOT_FOUND" });

    const [casinoRows, cosmetics, active, leagueStats, history, leagueCareer, leagueSeasons, leagueAwards] = await Promise.all([
      optionalQuery<(RowDataPacket & any)[]>(
        `SELECT daily_plays dailyPlays,daily_bet dailyBet,daily_won dailyWon,daily_lost dailyLost,
                total_plays totalPlays,total_bet totalBet,total_won totalWon,total_lost totalLost
         FROM casino_player_stats WHERE uuid=? LIMIT 1`,
        [uuid],
      ),
      optionalQuery<(RowDataPacket & any)[]>(
        `SELECT cosmetic_id id FROM player_available_cosmetics WHERE uuid=? ORDER BY cosmetic_id`,
        [uuid],
      ),
      optionalQuery<(RowDataPacket & any)[]>(
        `SELECT cosmetic_id id FROM player_active_cosmetics WHERE uuid=? ORDER BY cosmetic_id`,
        [uuid],
      ),
      optionalQuery<(RowDataPacket & any)[]>(
        `SELECT league_code league,goals,assists,saves
         FROM blockball_league_player_stats WHERE player_uuid=? ORDER BY league_code`,
        [uuid],
      ),
      loadMmrHistory(uuid),
      optionalQuery<(RowDataPacket & any)[]>(
        `SELECT matches,goals,assists,saves,clean_sheets cleanSheets,wins,draws,losses
         FROM league_total_player_stats WHERE player_uuid=? LIMIT 1`,
        [uuid],
      ),
      optionalQuery<(RowDataPacket & any)[]>(
        `SELECT league_id league,season_id season,matches,goals,assists,saves,
                clean_sheets cleanSheets,wins,draws,losses,finalized
         FROM league_player_season_stats WHERE player_uuid=?
         ORDER BY finalized ASC,season_id DESC,league_id`,
        [uuid],
      ),
      optionalQuery<(RowDataPacket & any)[]>(
        `SELECT league_id league,season_id season,award_type awardType,amount,awarded_at awardedAt
         FROM league_player_awards WHERE player_uuid=?
         ORDER BY season_id DESC,league_id,award_type`,
        [uuid],
      ),
    ]);

    const hasRankedData = base.mmr != null;
    const ranked = hasRankedData ? { ...rankedFromPlayer(base), history } : null;

    return res.json({
      uuid: String(base.uuid).toLowerCase(),
      name: base.resolved_name,
      level: number(base.level) || 1,
      xp: number(base.xp),
      coins: number(base.coins),
      language: base.language || "en",
      lastSeen: base.lastSeen == null ? null : number(base.lastSeen),
      casino: casinoRows[0] || null,
      cosmetics: cosmetics.map((item) => item.id),
      activeCosmetics: active.map((item) => item.id),
      leagueStats,
      leagueHistory: {
        career: leagueCareer[0] || null,
        seasons: leagueSeasons.map((row) => ({ ...row, finalized: Boolean(row.finalized) })),
        awards: leagueAwards,
      },
      ranked,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
