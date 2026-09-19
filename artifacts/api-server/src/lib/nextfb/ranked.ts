import type { RowDataPacket } from "mysql2/promise";

import { queryFb } from "./db";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
export const DEFAULT_RANKED_MMR = 500;

export const RANKED_STATS = [
  "GOALS",
  "ASSISTS",
  "SAVES",
  "MATCHES_PLAYED",
  "PASSES",
  "SHOTS_ON_NET",
  "WINS",
  "LOSSES",
  "DRAWS",
] as const;

export type RankedStat = (typeof RANKED_STATS)[number];

export const RANK_NAMES = [
  "IRON",
  "BRONZE",
  "GOLD",
  "EMERALD",
  "PLATINUM",
  "RUBY",
  "DIAMOND",
  "LEGEND",
  "MYTHIC",
] as const;

export type RankName = (typeof RANK_NAMES)[number];

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

export type RankedStats = Record<RankedStat, number>;

export interface RankedRank {
  name: RankName;
  displayName: string;
  symbol: string;
  minimumMmr: number;
  maximumMmr: number | null;
  division: 1 | 2 | 3;
  divisionRoman: "I" | "II" | "III";
  displayWithDivision: string;
}

export interface RankedProfile {
  uuid: string;
  mmr: number;
  wins: number;
  losses: number;
  banned: boolean;
  permanentBan: boolean;
  rankedBanUntil: number | null;
  rank: RankedRank;
  stats: RankedStats;
}

export interface RankedLeaderboardEntry extends RankedProfile {
  position: number;
}

export interface RankedSeasonSummary {
  seasonId: number;
  startedAt: Date | null;
  endedAt: Date;
  playerCount: number;
  eligiblePlayerCount: number;
}

export interface RankedSeasonOverview {
  currentSeason: number;
  currentSeasonStartedAt: Date | null;
  archivedSeasons: RankedSeasonSummary[];
}

export interface RankedSeasonLeaderboardEntry extends RankedLeaderboardEntry {
  seasonId: number;
  peakMmr: number;
  officialPosition: number | null;
  allTimeMatchesAtEnd: number;
}

export interface RankedPlayerSeasonRecord {
  seasonId: number;
  startedAt: Date | null;
  endedAt: Date;
  finalMmr: number;
  peakMmr: number;
  finalPosition: number | null;
  allTimeMatchesAtEnd: number;
  rank: RankedRank;
  stats: RankedStats;
}

export interface RankedStatLeaderboardEntry {
  position: number;
  uuid: string;
  stat: RankedStat;
  value: number;
  mmr: number;
  rank: RankedRank;
}

export interface MmrHistoryEntry {
  id: number;
  uuid: string;
  mmr: number;
  rank: RankedRank;
  createdAt: Date;
}

interface RankedPlayerRow extends RowDataPacket {
  uuid: string;
  mmr: number;
  wins: number;
  losses: number;
  banned: number | boolean;
  ranked_ban_until: number | string;
}

interface RankedStatRow extends RowDataPacket {
  uuid: string;
  stat: string;
  value: number;
}

interface RankedStatLeaderboardRow extends RowDataPacket {
  uuid: string;
  value: number;
  mmr: number;
}

interface RankedSeasonStateRow extends RowDataPacket {
  current_season: number;
  started_at: Date | string | null;
}

interface RankedSeasonRow extends RowDataPacket {
  season_id: number;
  started_at: Date | string | null;
  ended_at: Date | string;
  player_count: number;
  eligible_player_count: number;
}

interface RankedSeasonPlayerRow extends RowDataPacket {
  season_id: number;
  uuid: string;
  final_mmr: number;
  peak_mmr: number;
  final_position: number | null;
  all_time_matches_at_end: number;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  goals: number;
  assists: number;
  saves: number;
  passes: number;
  shots_on_net: number;
}

interface RankedPlayerSeasonRow extends RankedSeasonPlayerRow {
  started_at: Date | string | null;
  ended_at: Date | string;
}

interface MmrHistoryRow extends RowDataPacket {
  id: number;
  uuid: string;
  mmr: number;
  created_at: Date | string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface RankDefinition {
  name: RankName;
  displayName: string;
  symbol: string;
  minimumMmr: number;
  maximumMmr: number;
}

const RANK_DEFINITIONS: readonly RankDefinition[] = [
  { name: "IRON", displayName: "Iron", symbol: "⬤", minimumMmr: 500, maximumMmr: 650 },
  { name: "BRONZE", displayName: "Bronze", symbol: "⬛", minimumMmr: 650, maximumMmr: 800 },
  { name: "GOLD", displayName: "Gold", symbol: "⬟", minimumMmr: 800, maximumMmr: 950 },
  { name: "EMERALD", displayName: "Emerald", symbol: "✳", minimumMmr: 950, maximumMmr: 1100 },
  { name: "PLATINUM", displayName: "Platinum", symbol: "◆", minimumMmr: 1100, maximumMmr: 1250 },
  { name: "RUBY", displayName: "Ruby", symbol: "❖", minimumMmr: 1250, maximumMmr: 1450 },
  { name: "DIAMOND", displayName: "Diamond", symbol: "⬢", minimumMmr: 1450, maximumMmr: 1650 },
  { name: "LEGEND", displayName: "Legend", symbol: "✦", minimumMmr: 1650, maximumMmr: 1850 },
  { name: "MYTHIC", displayName: "Mythic", symbol: "✪", minimumMmr: 1850, maximumMmr: Number.MAX_SAFE_INTEGER },
] as const;

function normalizeNonNegative(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
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

function normalizeUuid(uuid: string): string {
  const value = uuid.trim().toLowerCase();
  if (!value) throw new Error("Player UUID cannot be empty");
  return value;
}

function createEmptyRankedStats(): RankedStats {
  return {
    GOALS: 0,
    ASSISTS: 0,
    SAVES: 0,
    MATCHES_PLAYED: 0,
    PASSES: 0,
    SHOTS_ON_NET: 0,
    WINS: 0,
    LOSSES: 0,
    DRAWS: 0,
  };
}

function mapStats(rows: readonly RankedStatRow[]): RankedStats {
  const stats = createEmptyRankedStats();

  for (const row of rows) {
    if (!isRankedStat(row.stat)) continue;
    stats[row.stat] = normalizeNonNegative(row.value);
  }

  return stats;
}

function parseBanUntil(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function isBanActive(
  bannedColumn: boolean,
  rankedBanUntil: number,
): boolean {
  if (rankedBanUntil === -1) return true;
  if (rankedBanUntil > Date.now()) return true;

  // Compatibilità con vecchie righe che usavano solo la colonna banned.
  return bannedColumn && rankedBanUntil === 0;
}

function mapProfile(
  row: RankedPlayerRow,
  statRows: readonly RankedStatRow[],
): RankedProfile {
  const mmr = normalizeNonNegative(row.mmr);
  const legacyWins = normalizeNonNegative(row.wins);
  const legacyLosses = normalizeNonNegative(row.losses);
  const stats = mapStats(statRows);

  // RankedProfile Java mantiene questi campi sincronizzati.
  if (!statRows.some((item) => item.stat === "WINS")) stats.WINS = legacyWins;
  if (!statRows.some((item) => item.stat === "LOSSES")) stats.LOSSES = legacyLosses;

  const banUntil = parseBanUntil(row.ranked_ban_until);
  const banned = isBanActive(Boolean(row.banned), banUntil);

  return {
    uuid: row.uuid,
    mmr,
    wins: stats.WINS,
    losses: stats.LOSSES,
    banned,
    permanentBan: banUntil === -1,
    rankedBanUntil: banUntil > 0 ? banUntil : null,
    rank: getRankFromMmr(mmr),
    stats,
  };
}

export function isRankedStat(value: string): value is RankedStat {
  return (RANKED_STATS as readonly string[]).includes(value);
}

export function getRankFromMmr(rawMmr: number): RankedRank {
  const mmr = normalizeNonNegative(rawMmr);
  const definition =
    RANK_DEFINITIONS.find(
      (rank) => mmr >= rank.minimumMmr && mmr < rank.maximumMmr,
    ) ?? RANK_DEFINITIONS[0];

  let division: 1 | 2 | 3 = 1;

  if (definition.name !== "MYTHIC") {
    const range = definition.maximumMmr - definition.minimumMmr;
    const part = Math.floor(range / 3);

    if (mmr < definition.minimumMmr + part) division = 3;
    else if (mmr < definition.minimumMmr + part * 2) division = 2;
  }

  const divisionRoman = division === 1 ? "I" : division === 2 ? "II" : "III";

  return {
    name: definition.name,
    displayName: definition.displayName,
    symbol: definition.symbol,
    minimumMmr: definition.minimumMmr,
    maximumMmr:
      definition.name === "MYTHIC" ? null : definition.maximumMmr,
    division,
    divisionRoman,
    displayWithDivision:
      definition.name === "MYTHIC"
        ? definition.displayName
        : `${definition.displayName} ${divisionRoman}`,
  };
}

export async function rankedPlayerExists(uuid: string): Promise<boolean> {
  const normalizedUuid = normalizeUuid(uuid);
  const rows = await queryFb<CountRow[]>(
    `SELECT COUNT(*) AS total FROM ranked_players WHERE uuid = ?`,
    [normalizedUuid],
  );

  return normalizeNonNegative(rows[0]?.total) > 0;
}

export async function getRankedProfile(
  uuid: string,
): Promise<RankedProfile | null> {
  const normalizedUuid = normalizeUuid(uuid);

  const [playerRows, statRows] = await Promise.all([
    queryFb<RankedPlayerRow[]>(
      `
        SELECT uuid, mmr, wins, losses, banned, ranked_ban_until
        FROM ranked_players
        WHERE uuid = ?
        LIMIT 1
      `,
      [normalizedUuid],
    ),
    queryFb<RankedStatRow[]>(
      `SELECT uuid, stat, value FROM ranked_player_stats WHERE uuid = ?`,
      [normalizedUuid],
    ),
  ]);

  return playerRows[0] ? mapProfile(playerRows[0], statRows) : null;
}

export async function getRankedLeaderboard(
  options: PaginationOptions = {},
  includeBanned = false,
): Promise<PaginatedResult<RankedLeaderboardEntry>> {
  const { limit, offset } = normalizePagination(options);
  const banFilter = includeBanned
    ? ""
    : `
      WHERE NOT (
        ranked_ban_until = -1
        OR ranked_ban_until > ?
        OR (banned = TRUE AND ranked_ban_until = 0)
      )
    `;
  const now = Date.now();
  const parameters = includeBanned ? [] : [now];
  const countParameters = includeBanned ? [] : [now];

  const [playerRows, countRows] = await Promise.all([
    queryFb<RankedPlayerRow[]>(
      `
        SELECT uuid, mmr, wins, losses, banned, ranked_ban_until
        FROM ranked_players
        ${banFilter}
        ORDER BY mmr DESC, wins DESC, losses ASC, uuid ASC
        LIMIT ${limit}
                OFFSET ${offset}
      `,
      parameters,
    ),
    queryFb<CountRow[]>(
      `SELECT COUNT(*) AS total FROM ranked_players ${banFilter}`,
      countParameters,
    ),
  ]);

  if (playerRows.length === 0) {
    return {
      data: [],
      total: normalizeNonNegative(countRows[0]?.total),
      limit,
      offset,
    };
  }

  const uuids = playerRows.map((row) => row.uuid);
  const placeholders = uuids.map(() => "?").join(", ");
  const statRows = await queryFb<RankedStatRow[]>(
    `
      SELECT uuid, stat, value
      FROM ranked_player_stats
      WHERE uuid IN (${placeholders})
    `,
    uuids,
  );

  const statsByUuid = new Map<string, RankedStatRow[]>();
  for (const row of statRows) {
    const rows = statsByUuid.get(row.uuid) ?? [];
    rows.push(row);
    statsByUuid.set(row.uuid, rows);
  }

  return {
    data: playerRows.map((row, index) => ({
      ...mapProfile(row, statsByUuid.get(row.uuid) ?? []),
      position: offset + index + 1,
    })),
    total: normalizeNonNegative(countRows[0]?.total),
    limit,
    offset,
  };
}

export async function getRankedSeasonOverview(): Promise<RankedSeasonOverview> {
  const [stateRows, seasonRows] = await Promise.all([
    queryFb<RankedSeasonStateRow[]>(
      `SELECT current_season, started_at FROM ranked_season_state WHERE id = 1 LIMIT 1`,
    ),
    queryFb<RankedSeasonRow[]>(
      `
        SELECT season_id, started_at, ended_at, player_count, eligible_player_count
        FROM ranked_seasons
        ORDER BY season_id DESC
      `,
    ),
  ]);

  const state = stateRows[0];

  return {
    currentSeason: Math.max(1, normalizeNonNegative(state?.current_season) || 1),
    currentSeasonStartedAt: state?.started_at
      ? state.started_at instanceof Date
        ? state.started_at
        : new Date(state.started_at)
      : null,
    archivedSeasons: seasonRows.map((row) => ({
      seasonId: normalizeNonNegative(row.season_id),
      startedAt: row.started_at
        ? row.started_at instanceof Date
          ? row.started_at
          : new Date(row.started_at)
        : null,
      endedAt: row.ended_at instanceof Date ? row.ended_at : new Date(row.ended_at),
      playerCount: normalizeNonNegative(row.player_count),
      eligiblePlayerCount: normalizeNonNegative(row.eligible_player_count),
    })),
  };
}

export async function getRankedSeasonLeaderboard(
  seasonId: number,
  options: PaginationOptions = {},
): Promise<PaginatedResult<RankedSeasonLeaderboardEntry>> {
  if (!Number.isInteger(seasonId) || seasonId <= 0) {
    throw new Error(`Invalid ranked season: ${seasonId}`);
  }

  const { limit, offset } = normalizePagination(options);
  const [rows, countRows] = await Promise.all([
    queryFb<RankedSeasonPlayerRow[]>(
      `
        SELECT
          season_id, uuid, final_mmr, peak_mmr, final_position,
          all_time_matches_at_end, matches_played, wins, losses, draws,
          goals, assists, saves, passes, shots_on_net
        FROM ranked_season_players
        WHERE season_id = ?
        ORDER BY
          CASE WHEN final_position IS NULL THEN 1 ELSE 0 END,
          final_position ASC,
          final_mmr DESC,
          wins DESC,
          uuid ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
      [seasonId],
    ),
    queryFb<CountRow[]>(
      `SELECT COUNT(*) AS total FROM ranked_season_players WHERE season_id = ?`,
      [seasonId],
    ),
  ]);

  return {
    data: rows.map((row, index) => {
      const mmr = normalizeNonNegative(row.final_mmr);
      const stats: RankedStats = {
        GOALS: normalizeNonNegative(row.goals),
        ASSISTS: normalizeNonNegative(row.assists),
        SAVES: normalizeNonNegative(row.saves),
        MATCHES_PLAYED: normalizeNonNegative(row.matches_played),
        PASSES: normalizeNonNegative(row.passes),
        SHOTS_ON_NET: normalizeNonNegative(row.shots_on_net),
        WINS: normalizeNonNegative(row.wins),
        LOSSES: normalizeNonNegative(row.losses),
        DRAWS: normalizeNonNegative(row.draws),
      };

      const officialPosition = row.final_position == null
        ? null
        : normalizeNonNegative(row.final_position) || null;

      return {
        seasonId: normalizeNonNegative(row.season_id),
        uuid: row.uuid,
        mmr,
        peakMmr: Math.max(mmr, normalizeNonNegative(row.peak_mmr)),
        wins: stats.WINS,
        losses: stats.LOSSES,
        banned: false,
        permanentBan: false,
        rankedBanUntil: null,
        rank: getRankFromMmr(mmr),
        stats,
        position: officialPosition ?? offset + index + 1,
        officialPosition,
        allTimeMatchesAtEnd: normalizeNonNegative(row.all_time_matches_at_end),
      };
    }),
    total: normalizeNonNegative(countRows[0]?.total),
    limit,
    offset,
  };
}

export async function getRankedPlayerSeasonHistory(
  uuid: string,
): Promise<RankedPlayerSeasonRecord[]> {
  const normalizedUuid = normalizeUuid(uuid);
  const rows = await queryFb<RankedPlayerSeasonRow[]>(
    `
      SELECT
        sp.season_id, sp.uuid, sp.final_mmr, sp.peak_mmr, sp.final_position,
        sp.all_time_matches_at_end, sp.matches_played, sp.wins, sp.losses,
        sp.draws, sp.goals, sp.assists, sp.saves, sp.passes, sp.shots_on_net,
        s.started_at, s.ended_at
      FROM ranked_season_players AS sp
      INNER JOIN ranked_seasons AS s ON s.season_id = sp.season_id
      WHERE sp.uuid = ?
      ORDER BY sp.season_id DESC
    `,
    [normalizedUuid],
  );

  return rows.map((row) => {
    const finalMmr = normalizeNonNegative(row.final_mmr);
    const stats: RankedStats = {
      GOALS: normalizeNonNegative(row.goals),
      ASSISTS: normalizeNonNegative(row.assists),
      SAVES: normalizeNonNegative(row.saves),
      MATCHES_PLAYED: normalizeNonNegative(row.matches_played),
      PASSES: normalizeNonNegative(row.passes),
      SHOTS_ON_NET: normalizeNonNegative(row.shots_on_net),
      WINS: normalizeNonNegative(row.wins),
      LOSSES: normalizeNonNegative(row.losses),
      DRAWS: normalizeNonNegative(row.draws),
    };

    return {
      seasonId: normalizeNonNegative(row.season_id),
      startedAt: row.started_at
        ? row.started_at instanceof Date
          ? row.started_at
          : new Date(row.started_at)
        : null,
      endedAt: row.ended_at instanceof Date ? row.ended_at : new Date(row.ended_at),
      finalMmr,
      peakMmr: Math.max(finalMmr, normalizeNonNegative(row.peak_mmr)),
      finalPosition: row.final_position == null
        ? null
        : normalizeNonNegative(row.final_position) || null,
      allTimeMatchesAtEnd: normalizeNonNegative(row.all_time_matches_at_end),
      rank: getRankFromMmr(finalMmr),
      stats,
    };
  });
}

export async function getRankedStatLeaderboard(
  stat: RankedStat,
  options: PaginationOptions = {},
): Promise<PaginatedResult<RankedStatLeaderboardEntry>> {
  if (!isRankedStat(stat)) {
    throw new Error(`Invalid ranked stat: ${stat}`);
  }

  const { limit, offset } = normalizePagination(options);
  const now = Date.now();

  const [rows, countRows] = await Promise.all([
    queryFb<RankedStatLeaderboardRow[]>(
      `
        SELECT rps.uuid, rps.value, rp.mmr
        FROM ranked_player_stats AS rps
        INNER JOIN ranked_players AS rp ON rp.uuid = rps.uuid
        WHERE rps.stat = ?
          AND rps.value > 0
          AND NOT (
            rp.ranked_ban_until = -1
            OR rp.ranked_ban_until > ?
            OR (rp.banned = TRUE AND rp.ranked_ban_until = 0)
          )
        ORDER BY rps.value DESC, rp.mmr DESC, rps.uuid ASC
        LIMIT ${limit}
                OFFSET ${offset}
      `,
      [stat, now],
    ),
    queryFb<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM ranked_player_stats AS rps
        INNER JOIN ranked_players AS rp ON rp.uuid = rps.uuid
        WHERE rps.stat = ?
          AND rps.value > 0
          AND NOT (
            rp.ranked_ban_until = -1
            OR rp.ranked_ban_until > ?
            OR (rp.banned = TRUE AND rp.ranked_ban_until = 0)
          )
      `,
      [stat, now],
    ),
  ]);

  return {
    data: rows.map((row, index) => ({
      position: offset + index + 1,
      uuid: row.uuid,
      stat,
      value: normalizeNonNegative(row.value),
      mmr: normalizeNonNegative(row.mmr),
      rank: getRankFromMmr(row.mmr),
    })),
    total: normalizeNonNegative(countRows[0]?.total),
    limit,
    offset,
  };
}

export async function getPlayerMmrHistory(
  uuid: string,
  options: PaginationOptions = {},
): Promise<PaginatedResult<MmrHistoryEntry>> {
  const normalizedUuid = normalizeUuid(uuid);
  const { limit, offset } = normalizePagination(options);

  const [rows, countRows] = await Promise.all([
    queryFb<MmrHistoryRow[]>(
      `
        SELECT id, uuid, mmr, created_at
        FROM player_mmr_history
        WHERE uuid = ?
        ORDER BY created_at DESC, id DESC
        LIMIT ${limit}
                OFFSET ${offset}
      `,
      [normalizedUuid],
    ),
    queryFb<CountRow[]>(
      `SELECT COUNT(*) AS total FROM player_mmr_history WHERE uuid = ?`,
      [normalizedUuid],
    ),
  ]);

  return {
    data: rows.map((row) => ({
      id: normalizeNonNegative(row.id),
      uuid: row.uuid,
      mmr: normalizeNonNegative(row.mmr),
      rank: getRankFromMmr(row.mmr),
      createdAt:
        row.created_at instanceof Date
          ? row.created_at
          : new Date(row.created_at),
    })),
    total: normalizeNonNegative(countRows[0]?.total),
    limit,
    offset,
  };
}
