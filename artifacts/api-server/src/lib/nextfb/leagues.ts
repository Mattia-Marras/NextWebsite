
import type { RowDataPacket } from "mysql2/promise";

import { queryFb } from "./db";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export const LEAGUE_PLAYER_STATS = [
  "goals",
  "assists",
  "passes",
  "shotsOnNet",
  "saves",
  "matchesPlayed",
] as const;

export type LeaguePlayerStat = (typeof LEAGUE_PLAYER_STATS)[number];

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface LeagueSummary {
  id: number;
  name: string;
  teams: number;
  players: number;
}

export interface LeagueTeamStanding {
  position: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface LeaguePlayerStatistics {
  playerUuid: string;
  goals: number;
  assists: number;
  passes: number;
  shotsOnNet: number;
  saves: number;
  matchesPlayed: number;
}

export interface LeaguePlayerLeaderboardEntry
  extends LeaguePlayerStatistics {
  position: number;
  stat: LeaguePlayerStat;
  value: number;
}

export interface LeagueDetails {
  id: number;
  name: string;
  standings: LeagueTeamStanding[];
  playerCount: number;
}

interface LeagueSummaryRow extends RowDataPacket {
  id: number;
  name: string;
  teams: number;
  players: number;
}

interface LeagueRow extends RowDataPacket {
  id: number;
  name: string;
}

interface LeagueTeamRow extends RowDataPacket {
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

interface LeaguePlayerRow extends RowDataPacket {
  player_uuid: string;
  goals: number;
  assists: number;
  passes: number;
  shots_on_net: number;
  saves: number;
  matches_played: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

const LEAGUE_STAT_COLUMNS: Record<LeaguePlayerStat, string> = {
  goals: "goals",
  assists: "assists",
  passes: "passes",
  shotsOnNet: "shots_on_net",
  saves: "saves",
  matchesPlayed: "matches_played",
};

function normalizeNonNegative(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

function normalizePositiveId(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid league id: ${value}`);
  }

  return value;
}

function normalizeLeagueName(value: string): string {
  const name = value.trim();

  if (!name) {
    throw new Error("League name cannot be empty");
  }

  return name;
}

function normalizePagination(
  options: PaginationOptions = {},
): Required<PaginationOptions> {
  const rawLimit = Number(options.limit ?? DEFAULT_LIMIT);
  const rawOffset = Number(options.offset ?? 0);

  return {
    limit: Number.isFinite(rawLimit)
      ? Math.min(MAX_LIMIT, Math.max(1, Math.trunc(rawLimit)))
      : DEFAULT_LIMIT,
    offset: Number.isFinite(rawOffset)
      ? Math.max(0, Math.trunc(rawOffset))
      : 0,
  };
}

function mapPlayerStats(row: LeaguePlayerRow): LeaguePlayerStatistics {
  return {
    playerUuid: row.player_uuid,
    goals: normalizeNonNegative(row.goals),
    assists: normalizeNonNegative(row.assists),
    passes: normalizeNonNegative(row.passes),
    shotsOnNet: normalizeNonNegative(row.shots_on_net),
    saves: normalizeNonNegative(row.saves),
    matchesPlayed: normalizeNonNegative(row.matches_played),
  };
}

function mapStandings(rows: readonly LeagueTeamRow[]): LeagueTeamStanding[] {
  return rows.map((row, index) => {
    const goalsFor = normalizeNonNegative(row.goals_for);
    const goalsAgainst = normalizeNonNegative(row.goals_against);

    return {
      position: index + 1,
      teamName: row.team_name,
      played: normalizeNonNegative(row.played),
      won: normalizeNonNegative(row.won),
      drawn: normalizeNonNegative(row.drawn),
      lost: normalizeNonNegative(row.lost),
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: normalizeNonNegative(row.points),
    };
  });
}

export function isLeaguePlayerStat(
  value: string,
): value is LeaguePlayerStat {
  return (LEAGUE_PLAYER_STATS as readonly string[]).includes(value);
}

export async function getLeagues(): Promise<LeagueSummary[]> {
  const rows = await queryFb<LeagueSummaryRow[]>(
    `
      SELECT
        l.id,
        l.name,
        COUNT(DISTINCT lt.team_name) AS teams,
        COUNT(DISTINCT ps.player_uuid) AS players
      FROM leagues AS l
      LEFT JOIN league_teams AS lt
        ON lt.league_id = l.id
      LEFT JOIN player_stats AS ps
        ON ps.league_id = l.id
      GROUP BY l.id, l.name
      ORDER BY l.name ASC
    `,
  );

  return rows.map((row) => ({
    id: normalizeNonNegative(row.id),
    name: row.name,
    teams: normalizeNonNegative(row.teams),
    players: normalizeNonNegative(row.players),
  }));
}

export async function getLeagueById(
  leagueId: number,
): Promise<LeagueDetails | null> {
  const id = normalizePositiveId(leagueId);

  const [leagueRows, teamRows, countRows] = await Promise.all([
    queryFb<LeagueRow[]>(
      `SELECT id, name FROM leagues WHERE id = ? LIMIT 1`,
      [id],
    ),
    queryFb<LeagueTeamRow[]>(
      `
        SELECT
          team_name,
          played,
          won,
          drawn,
          lost,
          goals_for,
          goals_against,
          points
        FROM league_teams
        WHERE league_id = ?
        ORDER BY
          points DESC,
          (goals_for - goals_against) DESC,
          goals_for DESC,
          team_name ASC
      `,
      [id],
    ),
    queryFb<CountRow[]>(
      `SELECT COUNT(*) AS total FROM player_stats WHERE league_id = ?`,
      [id],
    ),
  ]);

  const league = leagueRows[0];
  if (!league) return null;

  return {
    id: normalizeNonNegative(league.id),
    name: league.name,
    standings: mapStandings(teamRows),
    playerCount: normalizeNonNegative(countRows[0]?.total),
  };
}

export async function getLeagueByName(
  leagueName: string,
): Promise<LeagueDetails | null> {
  const name = normalizeLeagueName(leagueName);

  const rows = await queryFb<LeagueRow[]>(
    `SELECT id, name FROM leagues WHERE name = ? LIMIT 1`,
    [name],
  );

  return rows[0] ? getLeagueById(rows[0].id) : null;
}

export async function getLeagueStandings(
  leagueId: number,
): Promise<LeagueTeamStanding[]> {
  const id = normalizePositiveId(leagueId);

  const rows = await queryFb<LeagueTeamRow[]>(
    `
      SELECT
        team_name,
        played,
        won,
        drawn,
        lost,
        goals_for,
        goals_against,
        points
      FROM league_teams
      WHERE league_id = ?
      ORDER BY
        points DESC,
        (goals_for - goals_against) DESC,
        goals_for DESC,
        team_name ASC
    `,
    [id],
  );

  return mapStandings(rows);
}

export async function getLeaguePlayers(
  leagueId: number,
  options: PaginationOptions = {},
): Promise<PaginatedResult<LeaguePlayerStatistics>> {
  const id = normalizePositiveId(leagueId);
  const { limit, offset } = normalizePagination(options);

  const [rows, countRows] = await Promise.all([
    queryFb<LeaguePlayerRow[]>(
      `
        SELECT
          player_uuid,
          goals,
          assists,
          passes,
          shots_on_net,
          saves,
          matches_played
        FROM player_stats
        WHERE league_id = ?
        ORDER BY matches_played DESC, goals DESC, assists DESC, player_uuid ASC
        LIMIT ${limit}
                OFFSET ${offset}
      `,
      [id],
    ),
    queryFb<CountRow[]>(
      `SELECT COUNT(*) AS total FROM player_stats WHERE league_id = ?`,
      [id],
    ),
  ]);

  return {
    data: rows.map(mapPlayerStats),
    total: normalizeNonNegative(countRows[0]?.total),
    limit,
    offset,
  };
}

export async function getLeaguePlayerStats(
  leagueId: number,
  playerUuid: string,
): Promise<LeaguePlayerStatistics | null> {
  const id = normalizePositiveId(leagueId);
  const uuid = playerUuid.trim().toLowerCase();

  if (!uuid) {
    throw new Error("Player UUID cannot be empty");
  }

  const rows = await queryFb<LeaguePlayerRow[]>(
    `
      SELECT
        player_uuid,
        goals,
        assists,
        passes,
        shots_on_net,
        saves,
        matches_played
      FROM player_stats
      WHERE league_id = ? AND player_uuid = ?
      LIMIT 1
    `,
    [id, uuid],
  );

  return rows[0] ? mapPlayerStats(rows[0]) : null;
}

export async function getLeaguePlayerLeaderboard(
  leagueId: number,
  stat: LeaguePlayerStat,
  options: PaginationOptions = {},
): Promise<PaginatedResult<LeaguePlayerLeaderboardEntry>> {
  const id = normalizePositiveId(leagueId);

  if (!isLeaguePlayerStat(stat)) {
    throw new Error(`Invalid league player stat: ${stat}`);
  }

  const { limit, offset } = normalizePagination(options);
  const column = LEAGUE_STAT_COLUMNS[stat];

  const [rows, countRows] = await Promise.all([
    queryFb<LeaguePlayerRow[]>(
      `
        SELECT
          player_uuid,
          goals,
          assists,
          passes,
          shots_on_net,
          saves,
          matches_played
        FROM player_stats
        WHERE league_id = ? AND ${column} > 0
        ORDER BY ${column} DESC, matches_played ASC, player_uuid ASC
        LIMIT ${limit}
                OFFSET ${offset}
      `,
      [id],
    ),
    queryFb<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM player_stats
        WHERE league_id = ? AND ${column} > 0
      `,
      [id],
    ),
  ]);

  return {
    data: rows.map((row, index) => {
      const statistics = mapPlayerStats(row);

      return {
        ...statistics,
        position: offset + index + 1,
        stat,
        value: statistics[stat],
      };
    }),
    total: normalizeNonNegative(countRows[0]?.total),
    limit,
    offset,
  };
}
