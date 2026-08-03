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
