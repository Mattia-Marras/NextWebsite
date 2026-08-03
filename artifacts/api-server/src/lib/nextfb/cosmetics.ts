import type { RowDataPacket } from "mysql2";

import { queryFb } from "./db";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export const COSMETIC_TYPES = [
    "particle_pack",
    "movement_trail",
    "ball_trail",
    "hat",
    "ball",
    "item",
    "goal_explosion",
    "nametag",
] as const;

export type CosmeticType = (typeof COSMETIC_TYPES)[number];

export interface PlayerCosmeticRow extends RowDataPacket {
    uuid: string;
    cosmetic_id: string;
}

interface CosmeticCountRow extends RowDataPacket {
    cosmetic_id: string;
    owners: number | string;
    active_users: number | string;
}

interface CountRow extends RowDataPacket {
    total: number | string;
}

export interface PlayerCosmetic {
    id: string;
    type: CosmeticType | null;
    active: boolean;
}

export interface PlayerCosmetics {
    uuid: string;
    available: PlayerCosmetic[];
    active: PlayerCosmetic[];
    availableCount: number;
    activeCount: number;
}

export interface CosmeticPopularityEntry {
    id: string;
    type: CosmeticType | null;
    owners: number;
    activeUsers: number;
    activationRate: number | null;
    position: number;
}

export interface CosmeticOwner {
    uuid: string;
    active: boolean;
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

function normalizeCosmeticId(id: string): string {
    const normalized = id.trim().toLowerCase();

    if (
        normalized.length < 3 ||
        normalized.length > 50 ||
        !/^[a-z0-9_:-]+$/.test(normalized)
    ) {
        throw new Error(`Invalid cosmetic ID: ${id}`);
    }

    return normalized;
}

function toNonNegativeInteger(value: unknown): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return 0;
    }

    return Math.max(
        0,
        Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(parsed)),
    );
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

export function isCosmeticType(value: string): value is CosmeticType {
    return (COSMETIC_TYPES as readonly string[]).includes(value);
}

export function getCosmeticType(
    cosmeticId: string,
): CosmeticType | null {
    const separator = cosmeticId.indexOf(":");

    if (separator <= 0) {
        return null;
    }

    const prefix = cosmeticId.slice(0, separator).toLowerCase();

    return isCosmeticType(prefix) ? prefix : null;
}

function toPlayerCosmetic(
    id: string,
    active: boolean,
): PlayerCosmetic {
    return {
        id,
        type: getCosmeticType(id),
        active,
    };
}

export async function getPlayerCosmetics(
    uuid: string,
): Promise<PlayerCosmetics> {
    const normalizedUuid = normalizeUuid(uuid);

    const [availableRows, activeRows] = await Promise.all([
        queryFb<PlayerCosmeticRow[]>(
            `
                SELECT uuid, cosmetic_id
                FROM player_available_cosmetics
                WHERE uuid = ?
                ORDER BY cosmetic_id ASC
            `,
            [normalizedUuid],
        ),
        queryFb<PlayerCosmeticRow[]>(
            `
                SELECT uuid, cosmetic_id
                FROM player_active_cosmetics
                WHERE uuid = ?
                ORDER BY cosmetic_id ASC
            `,
            [normalizedUuid],
        ),
    ]);

    const activeIds = new Set(
        activeRows.map((row) => row.cosmetic_id),
    );

    const available = availableRows.map((row) =>
        toPlayerCosmetic(
            row.cosmetic_id,
            activeIds.has(row.cosmetic_id),
        ),
    );

    const availableIds = new Set(
        availableRows.map((row) => row.cosmetic_id),
    );

    /*
     * Mantiene visibili anche eventuali cosmetici attivi rimasti nel DB
     * ma non presenti nella tabella degli sbloccati.
     */
    const orphanActive = activeRows
        .filter((row) => !availableIds.has(row.cosmetic_id))
        .map((row) => toPlayerCosmetic(row.cosmetic_id, true));

    return {
        uuid: normalizedUuid,
        available: [...available, ...orphanActive],
        active: activeRows.map((row) =>
            toPlayerCosmetic(row.cosmetic_id, true),
        ),
        availableCount: available.length + orphanActive.length,
        activeCount: activeRows.length,
    };
}

export async function getAvailableCosmetics(
    uuid: string,
    type?: CosmeticType,
): Promise<PlayerCosmetic[]> {
    const cosmetics = await getPlayerCosmetics(uuid);

    return cosmetics.available.filter(
        (cosmetic) => !type || cosmetic.type === type,
    );
}

export async function getActiveCosmetics(
    uuid: string,
    type?: CosmeticType,
): Promise<PlayerCosmetic[]> {
    const cosmetics = await getPlayerCosmetics(uuid);

    return cosmetics.active.filter(
        (cosmetic) => !type || cosmetic.type === type,
    );
}

export async function playerOwnsCosmetic(
    uuid: string,
    cosmeticId: string,
): Promise<boolean> {
    const normalizedUuid = normalizeUuid(uuid);
    const normalizedId = normalizeCosmeticId(cosmeticId);

    const rows = await queryFb<CountRow[]>(
        `
            SELECT COUNT(*) AS total
            FROM player_available_cosmetics
            WHERE uuid = ?
              AND cosmetic_id = ?
        `,
        [normalizedUuid, normalizedId],
    );

    return toNonNegativeInteger(rows[0]?.total) > 0;
}

export async function playerHasCosmeticActive(
    uuid: string,
    cosmeticId: string,
): Promise<boolean> {
    const normalizedUuid = normalizeUuid(uuid);
    const normalizedId = normalizeCosmeticId(cosmeticId);

    const rows = await queryFb<CountRow[]>(
        `
            SELECT COUNT(*) AS total
            FROM player_active_cosmetics
            WHERE uuid = ?
              AND cosmetic_id = ?
        `,
        [normalizedUuid, normalizedId],
    );

    return toNonNegativeInteger(rows[0]?.total) > 0;
}

export async function getMostPopularCosmetics(
    options: PaginationOptions = {},
    type?: CosmeticType,
): Promise<PaginatedResult<CosmeticPopularityEntry>> {
    const { limit, offset } = normalizePagination(options);

    const typePrefix = type ? `${type}:%` : null;
    const whereClause = typePrefix
        ? "WHERE available.cosmetic_id LIKE ?"
        : "";
    const parameters = typePrefix
        ? [typePrefix]
        : [];
    const countParameters = typePrefix ? [typePrefix] : [];

    const [rows, countRows] = await Promise.all([
        queryFb<CosmeticCountRow[]>(
            `
                SELECT
                    available.cosmetic_id,
                    COUNT(DISTINCT available.uuid) AS owners,
                    COUNT(DISTINCT active.uuid) AS active_users
                FROM player_available_cosmetics AS available
                LEFT JOIN player_active_cosmetics AS active
                    ON active.uuid = available.uuid
                   AND active.cosmetic_id = available.cosmetic_id
                ${whereClause}
                GROUP BY available.cosmetic_id
                ORDER BY
                    owners DESC,
                    active_users DESC,
                    available.cosmetic_id ASC
                LIMIT ${limit}
                OFFSET ${offset}
            `,
            parameters,
        ),
        queryFb<CountRow[]>(
            `
                SELECT COUNT(DISTINCT available.cosmetic_id) AS total
                FROM player_available_cosmetics AS available
                ${whereClause}
            `,
            countParameters,
        ),
    ]);

    return {
        data: rows.map((row, index) => {
            const owners = toNonNegativeInteger(row.owners);
            const activeUsers = toNonNegativeInteger(
                row.active_users,
            );

            return {
                id: row.cosmetic_id,
                type: getCosmeticType(row.cosmetic_id),
                owners,
                activeUsers,
                activationRate:
                    owners > 0 ? activeUsers / owners : null,
                position: offset + index + 1,
            };
        }),
        total: toNonNegativeInteger(countRows[0]?.total),
        limit,
        offset,
    };
}

export async function getCosmeticOwners(
    cosmeticId: string,
    options: PaginationOptions = {},
): Promise<PaginatedResult<CosmeticOwner>> {
    const normalizedId = normalizeCosmeticId(cosmeticId);
    const { limit, offset } = normalizePagination(options);

    const [rows, countRows] = await Promise.all([
        queryFb<(PlayerCosmeticRow & { active: number | boolean })[]>(
            `
                SELECT
                    available.uuid,
                    available.cosmetic_id,
                    CASE
                        WHEN active.uuid IS NULL THEN 0
                        ELSE 1
                    END AS active
                FROM player_available_cosmetics AS available
                LEFT JOIN player_active_cosmetics AS active
                    ON active.uuid = available.uuid
                   AND active.cosmetic_id = available.cosmetic_id
                WHERE available.cosmetic_id = ?
                ORDER BY active DESC, available.uuid ASC
                LIMIT ${limit}
                OFFSET ${offset}
            `,
            [normalizedId],
        ),
        queryFb<CountRow[]>(
            `
                SELECT COUNT(*) AS total
                FROM player_available_cosmetics
                WHERE cosmetic_id = ?
            `,
            [normalizedId],
        ),
    ]);

    return {
        data: rows.map((row) => ({
            uuid: row.uuid,
            active: Boolean(row.active),
        })),
        total: toNonNegativeInteger(countRows[0]?.total),
        limit,
        offset,
    };
}

export async function getPlayersWithActiveCosmetic(
    cosmeticId: string,
    options: PaginationOptions = {},
): Promise<PaginatedResult<string>> {
    const normalizedId = normalizeCosmeticId(cosmeticId);
    const { limit, offset } = normalizePagination(options);

    const [rows, countRows] = await Promise.all([
        queryFb<PlayerCosmeticRow[]>(
            `
                SELECT uuid, cosmetic_id
                FROM player_active_cosmetics
                WHERE cosmetic_id = ?
                ORDER BY uuid ASC
                LIMIT ${limit}
                OFFSET ${offset}
            `,
            [normalizedId],
        ),
        queryFb<CountRow[]>(
            `
                SELECT COUNT(*) AS total
                FROM player_active_cosmetics
                WHERE cosmetic_id = ?
            `,
            [normalizedId],
        ),
    ]);

    return {
        data: rows.map((row) => row.uuid),
        total: toNonNegativeInteger(countRows[0]?.total),
        limit,
        offset,
    };
}
