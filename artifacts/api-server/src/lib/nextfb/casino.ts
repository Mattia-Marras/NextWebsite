import type { RowDataPacket } from "mysql2";

import { queryFb } from "./db";

const HOUSE_ROW_ID = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const DAILY_TIME_ZONE = "Europe/Rome";

export interface CasinoPlayerRow extends RowDataPacket {
    uuid: string;
    current_day: Date | string;
    daily_plays: number | string;
    daily_bet: number | string;
    daily_won: number | string;
    daily_lost: number | string;
    total_plays: number | string;
    total_bet: number | string;
    total_won: number | string;
    total_lost: number | string;
}

export interface CasinoHouseRow extends RowDataPacket {
    id: number;
    total_bet: number | string;
    total_paid_profit: number | string;
    total_profit: number | string;
}

interface CountRow extends RowDataPacket {
    total: number | string;
}

export interface CasinoPlayerStats {
    uuid: string;
    currentDay: string;
    dailyPlays: number;
    dailyBet: number;
    dailyWon: number;
    dailyLost: number;
    totalPlays: number;
    totalBet: number;
    totalWon: number;
    totalLost: number;
    dailyNet: number;
    totalNet: number;
    dailyReturnRate: number | null;
    totalReturnRate: number | null;
}

export interface CasinoHouseStats {
    totalBet: number;
    totalPaidProfit: number;
    totalProfit: number;
    returnToPlayerRate: number | null;
    houseEdgeRate: number | null;
}

export type CasinoLeaderboardMetric =
    | "dailyPlays"
    | "dailyBet"
    | "dailyWon"
    | "dailyLost"
    | "totalPlays"
    | "totalBet"
    | "totalWon"
    | "totalLost"
    | "dailyNet"
    | "totalNet";

export interface CasinoLeaderboardEntry extends CasinoPlayerStats {
    position: number;
}

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

const ORDER_EXPRESSIONS: Record<CasinoLeaderboardMetric, string> = {
    dailyPlays:
        "CASE WHEN current_day = ? THEN daily_plays ELSE 0 END",
    dailyBet:
        "CASE WHEN current_day = ? THEN daily_bet ELSE 0 END",
    dailyWon:
        "CASE WHEN current_day = ? THEN daily_won ELSE 0 END",
    dailyLost:
        "CASE WHEN current_day = ? THEN daily_lost ELSE 0 END",
    totalPlays: "total_plays",
    totalBet: "total_bet",
    totalWon: "total_won",
    totalLost: "total_lost",
    dailyNet:
        "(CASE WHEN current_day = ? THEN daily_won - daily_lost ELSE 0 END)",
    totalNet: "(total_won - total_lost)",
};

function normalizeUuid(uuid: string): string {
    const compact = uuid.trim().toLowerCase().replaceAll("-", "");

    if (!/^[0-9a-f]{32}$/.test(compact)) {
        throw new Error(`Invalid player UUID: ${uuid}`);
    }

    return [
        compact.slice(0, 8),
        compact.slice(8, 12),
        compact.slice(12, 16),
        compact.slice(16, 20),
        compact.slice(20),
    ].join("-");
}

function toSafeInteger(value: unknown): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return 0;
    }

    return Math.max(
        Number.MIN_SAFE_INTEGER,
        Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(parsed)),
    );
}

function toNonNegativeInteger(value: unknown): number {
    return Math.max(0, toSafeInteger(value));
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

function getRomeDate(): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: DAILY_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const values = Object.fromEntries(
        parts.map((part) => [part.type, part.value]),
    );

    return `${values.year}-${values.month}-${values.day}`;
}

function normalizeSqlDate(value: Date | string): string {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    return String(value).slice(0, 10);
}

function rate(numerator: number, denominator: number): number | null {
    if (denominator <= 0) {
        return null;
    }

    return numerator / denominator;
}

function mapPlayerStats(
    row: CasinoPlayerRow,
    today = getRomeDate(),
): CasinoPlayerStats {
    const currentDay = normalizeSqlDate(row.current_day);
    const isCurrentDay = currentDay === today;

    const dailyPlays = isCurrentDay
        ? toNonNegativeInteger(row.daily_plays)
        : 0;
    const dailyBet = isCurrentDay
        ? toNonNegativeInteger(row.daily_bet)
        : 0;
    const dailyWon = isCurrentDay
        ? toNonNegativeInteger(row.daily_won)
        : 0;
    const dailyLost = isCurrentDay
        ? toNonNegativeInteger(row.daily_lost)
        : 0;

    const totalPlays = toNonNegativeInteger(row.total_plays);
    const totalBet = toNonNegativeInteger(row.total_bet);
    const totalWon = toNonNegativeInteger(row.total_won);
    const totalLost = toNonNegativeInteger(row.total_lost);

    return {
        uuid: row.uuid,
        currentDay,
        dailyPlays,
        dailyBet,
        dailyWon,
        dailyLost,
        totalPlays,
        totalBet,
        totalWon,
        totalLost,
        dailyNet: dailyWon - dailyLost,
        totalNet: totalWon - totalLost,
        dailyReturnRate: rate(dailyWon, dailyBet),
        totalReturnRate: rate(totalWon, totalBet),
    };
}

export async function getCasinoPlayerStats(
    uuid: string,
): Promise<CasinoPlayerStats | null> {
    const normalizedUuid = normalizeUuid(uuid);

    const rows = await queryFb<CasinoPlayerRow[]>(
        `
            SELECT
                uuid,
                current_day,
                daily_plays,
                daily_bet,
                daily_won,
                daily_lost,
                total_plays,
                total_bet,
                total_won,
                total_lost
            FROM casino_player_stats
            WHERE uuid = ?
            LIMIT 1
        `,
        [normalizedUuid],
    );

    return rows[0] ? mapPlayerStats(rows[0]) : null;
}

export async function getCasinoHouseStats(): Promise<CasinoHouseStats> {
    const rows = await queryFb<CasinoHouseRow[]>(
        `
            SELECT
                id,
                total_bet,
                total_paid_profit,
                total_profit
            FROM casino_house_stats
            WHERE id = ?
            LIMIT 1
        `,
        [HOUSE_ROW_ID],
    );

    const row = rows[0];

    if (!row) {
        return {
            totalBet: 0,
            totalPaidProfit: 0,
            totalProfit: 0,
            returnToPlayerRate: null,
            houseEdgeRate: null,
        };
    }

    const totalBet = toNonNegativeInteger(row.total_bet);
    const totalPaidProfit = toNonNegativeInteger(
        row.total_paid_profit,
    );
    const totalProfit = toSafeInteger(row.total_profit);

    return {
        totalBet,
        totalPaidProfit,
        totalProfit,
        returnToPlayerRate: totalBet > 0
            ? (totalBet - totalProfit) / totalBet
            : null,
        houseEdgeRate: rate(totalProfit, totalBet),
    };
}

export async function getCasinoPlayers(
    options: PaginationOptions = {},
): Promise<PaginatedResult<CasinoPlayerStats>> {
    const { limit, offset } = normalizePagination(options);

    const [rows, countRows] = await Promise.all([
        queryFb<CasinoPlayerRow[]>(
            `
                SELECT
                    uuid,
                    current_day,
                    daily_plays,
                    daily_bet,
                    daily_won,
                    daily_lost,
                    total_plays,
                    total_bet,
                    total_won,
                    total_lost
                FROM casino_player_stats
                ORDER BY total_plays DESC, total_bet DESC, uuid ASC
                LIMIT ${limit}
                OFFSET ${offset}
            `,
            [],
        ),
        queryFb<CountRow[]>(
            `
                SELECT COUNT(*) AS total
                FROM casino_player_stats
            `,
        ),
    ]);

    return {
        data: rows.map((row) => mapPlayerStats(row)),
        total: toNonNegativeInteger(countRows[0]?.total),
        limit,
        offset,
    };
}

export async function getCasinoLeaderboard(
    metric: CasinoLeaderboardMetric = "totalWon",
    options: PaginationOptions = {},
): Promise<PaginatedResult<CasinoLeaderboardEntry>> {
    const expression = ORDER_EXPRESSIONS[metric];

    if (!expression) {
        throw new Error(`Invalid casino leaderboard metric: ${metric}`);
    }

    const { limit, offset } = normalizePagination(options);
    const today = getRomeDate();
    const usesTodayParameter = expression.includes("?");

    const rows = await queryFb<CasinoPlayerRow[]>(
        `
            SELECT
                uuid,
                current_day,
                daily_plays,
                daily_bet,
                daily_won,
                daily_lost,
                total_plays,
                total_bet,
                total_won,
                total_lost
            FROM casino_player_stats
            ORDER BY ${expression} DESC, total_plays DESC, uuid ASC
            LIMIT ${limit}
                OFFSET ${offset}
        `,
        usesTodayParameter
            ? [today]
            : [],
    );

    const countRows = await queryFb<CountRow[]>(
        `
            SELECT COUNT(*) AS total
            FROM casino_player_stats
        `,
    );

    return {
        data: rows.map((row, index) => ({
            ...mapPlayerStats(row, today),
            position: offset + index + 1,
        })),
        total: toNonNegativeInteger(countRows[0]?.total),
        limit,
        offset,
    };
}
