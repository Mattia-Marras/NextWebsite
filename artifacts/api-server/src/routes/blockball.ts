import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { queryBlockball } from "../lib/blockball-db";

const router = Router();
const leagues = new Set(["ML", "LL"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RANKS = [
  { name: "IRON", displayName: "Iron", minimumMmr: 500, maximumMmr: 649 },
  { name: "BRONZE", displayName: "Bronze", minimumMmr: 650, maximumMmr: 799 },
  { name: "GOLD", displayName: "Gold", minimumMmr: 800, maximumMmr: 949 },
  { name: "EMERALD", displayName: "Emerald", minimumMmr: 950, maximumMmr: 1099 },
  { name: "PLATINUM", displayName: "Platinum", minimumMmr: 1100, maximumMmr: 1249 },
  { name: "RUBY", displayName: "Ruby", minimumMmr: 1250, maximumMmr: 1449 },
  { name: "DIAMOND", displayName: "Diamond", minimumMmr: 1450, maximumMmr: 1649 },
  { name: "LEGEND", displayName: "Legend", minimumMmr: 1650, maximumMmr: 1849 },
  { name: "MYTHIC", displayName: "Mythic", minimumMmr: 1850, maximumMmr: null },
] as const;

function getRank(mmrValue: unknown) {
  const mmr = Math.max(0, Number(mmrValue) || 0);
  return [...RANKS].reverse().find((rank) => mmr >= rank.minimumMmr) ?? RANKS[0];
}

function league(value: unknown) {
  const result = String(value || "").toUpperCase();
  if (!leagues.has(result)) throw new Error("Invalid league");
  return result;
}

function statsMap(rows: Array<{ stat: string; value: unknown }>) {
  return Object.fromEntries(rows.map((row) => [String(row.stat).toUpperCase(), Number(row.value) || 0]));
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
          played: team.manual_played,
          won: team.manual_won,
          drawn: team.manual_drawn,
          lost: team.manual_lost,
          goalsFor: team.manual_goals_for,
          goalsAgainst: team.manual_goals_against,
          points: team.manual_points,
        },
      ]),
    );

    for (const match of matches) {
      const home = map.get(match.team1_name);
      const away = map.get(match.team2_name);
      if (!home || !away) continue;
      home.played++;
      away.played++;
      home.goalsFor += match.score1;
      home.goalsAgainst += match.score2;
      away.goalsFor += match.score2;
      away.goalsAgainst += match.score1;
      if (match.score1 > match.score2) {
        home.won++;
        away.lost++;
        home.points += 3;
      } else if (match.score2 > match.score1) {
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

    return res.json({
      league: code,
      standings,
      matches: matches.map((match) => ({
        id: match.id,
        team1: match.team1_name,
        team2: match.team2_name,
        score1: match.score1,
        score2: match.score2,
        matchday: match.matchday,
        playedAt: match.played_at,
      })),
      leaders: {
        goals: [...stats].sort((a, b) => b.goals - a.goals).slice(0, 10),
        assists: [...stats].sort((a, b) => b.assists - a.assists).slice(0, 10),
        saves: [...stats].sort((a, b) => b.saves - a.saves).slice(0, 10),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/ranked", async (_req, res, next) => {
  try {
    const players = await queryBlockball<(RowDataPacket & any)[]>(
      `SELECT rp.uuid,COALESCE(n.name,rp.uuid) name,rp.mmr,rp.wins,rp.losses,rp.banned,rp.ranked_ban_until rankedBanUntil
       FROM ranked_players rp
       LEFT JOIN player_names n ON n.uuid=rp.uuid
       ORDER BY rp.mmr DESC,rp.wins DESC,rp.losses ASC,rp.uuid ASC
       LIMIT 250`,
    );
    const statRows = await queryBlockball<(RowDataPacket & any)[]>(
      `SELECT uuid,stat,value FROM ranked_player_stats`,
    );
    const byUuid = new Map<string, Array<{ stat: string; value: unknown }>>();
    for (const row of statRows) {
      const values = byUuid.get(row.uuid) ?? [];
      values.push(row);
      byUuid.set(row.uuid, values);
    }

    const leaderboard = players.map((player, index) => {
      const wins = Number(player.wins) || 0;
      const losses = Number(player.losses) || 0;
      const games = wins + losses;
      return {
        position: index + 1,
        uuid: player.uuid,
        name: player.name,
        mmr: Number(player.mmr) || 0,
        wins,
        losses,
        games,
        winRate: games ? (wins / games) * 100 : 0,
        banned: Boolean(player.banned),
        rankedBanUntil: player.rankedBanUntil == null ? null : Number(player.rankedBanUntil),
        rank: getRank(player.mmr),
        stats: statsMap(byUuid.get(player.uuid) ?? []),
      };
    });

    const statNames = [...new Set(statRows.map((row) => String(row.stat).toUpperCase()))].sort();
    return res.json({ leaderboard, statNames, ranks: RANKS });
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
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.get("/players", async (_req, res, next) => {
  try {
    const rows = await queryBlockball<(RowDataPacket & any)[]>(
      `SELECT p.uuid,COALESCE(n.name,p.uuid) name,p.level,p.xp,p.coins
       FROM players p LEFT JOIN player_names n ON n.uuid=p.uuid
       ORDER BY p.level DESC,p.xp DESC LIMIT 100`,
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.get("/players/:uuid", async (req, res, next) => {
  try {
    const uuid = String(req.params.uuid).toLowerCase();
    if (!uuidPattern.test(uuid)) return res.status(400).json({ error: "INVALID_UUID" });
    const rows = await queryBlockball<(RowDataPacket & any)[]>(
      `SELECT p.uuid,COALESCE(n.name,p.uuid) name,p.level,p.xp,p.coins,p.language,n.last_seen lastSeen
       FROM players p LEFT JOIN player_names n ON n.uuid=p.uuid WHERE p.uuid=? LIMIT 1`,
      [uuid],
    );
    if (!rows[0]) return res.status(404).json({ error: "BLOCKBALL_PLAYER_NOT_FOUND" });

    const [casinoRows, cosmetics, active, leagueStats, rankedRows, rankedStatRows, historyRows] = await Promise.all([
      queryBlockball<(RowDataPacket & any)[]>(
        `SELECT daily_plays dailyPlays,daily_bet dailyBet,daily_won dailyWon,daily_lost dailyLost,
                total_plays totalPlays,total_bet totalBet,total_won totalWon,total_lost totalLost
         FROM casino_player_stats WHERE uuid=? LIMIT 1`,
        [uuid],
      ),
      queryBlockball<(RowDataPacket & any)[]>(
        `SELECT cosmetic_id id FROM player_available_cosmetics WHERE uuid=? ORDER BY cosmetic_id`,
        [uuid],
      ),
      queryBlockball<(RowDataPacket & any)[]>(
        `SELECT cosmetic_id id FROM player_active_cosmetics WHERE uuid=? ORDER BY cosmetic_id`,
        [uuid],
      ),
      queryBlockball<(RowDataPacket & any)[]>(
        `SELECT league_code league,goals,assists,saves FROM blockball_league_player_stats WHERE player_uuid=? ORDER BY league_code`,
        [uuid],
      ),
      queryBlockball<(RowDataPacket & any)[]>(
        `SELECT uuid,mmr,wins,losses,banned,ranked_ban_until rankedBanUntil FROM ranked_players WHERE uuid=? LIMIT 1`,
        [uuid],
      ),
      queryBlockball<(RowDataPacket & any)[]>(
        `SELECT stat,value FROM ranked_player_stats WHERE uuid=? ORDER BY stat`,
        [uuid],
      ),
      queryBlockball<(RowDataPacket & any)[]>(
        `SELECT id,mmr,created_at createdAt FROM player_mmr_history WHERE uuid=? ORDER BY created_at ASC,id ASC LIMIT 500`,
        [uuid],
      ),
    ]);

    const rankedRow = rankedRows[0];
    const ranked = rankedRow
      ? {
          mmr: Number(rankedRow.mmr) || 0,
          wins: Number(rankedRow.wins) || 0,
          losses: Number(rankedRow.losses) || 0,
          banned: Boolean(rankedRow.banned),
          rankedBanUntil: rankedRow.rankedBanUntil == null ? null : Number(rankedRow.rankedBanUntil),
          rank: getRank(rankedRow.mmr),
          stats: statsMap(rankedStatRows),
          history: historyRows.map((row) => ({
            id: row.id,
            mmr: Number(row.mmr) || 0,
            createdAt: row.createdAt,
            rank: getRank(row.mmr),
          })),
        }
      : null;

    return res.json({
      ...rows[0],
      casino: casinoRows[0] || null,
      cosmetics: cosmetics.map((item) => item.id),
      activeCosmetics: active.map((item) => item.id),
      leagueStats,
      ranked,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
