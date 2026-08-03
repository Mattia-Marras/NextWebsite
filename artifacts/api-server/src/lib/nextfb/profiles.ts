import { queryFb } from "./db";

import {
    GAME_MODES,
    PLAYER_SETTINGS,
    PLAYER_STATS,
    createDefaultPlayerSettings,
    createEmptyPlayerStats,
    isGameMode,
    isPlayerSetting,
    isPlayerStat,
    type GameMode,
    type PaginatedResult,
    type PaginationOptions,
    type PlayerBaseProfile,
    type PlayerCountRow,
    type PlayerGlobalStatRow,
    type PlayerLeaderboardEntry,
    type PlayerLeaderboardRow,
    type PlayerModeStatRow,
    type PlayerModeStats,
    type PlayerProfile,
    type PlayerProfileOrder,
    type PlayerProfileSummary,
    type PlayerRow,
    type PlayerSearchOptions,
    type PlayerSettingRow,
    type PlayerSettings,
    type PlayerStat,
    type PlayerStats,
    type SortDirection,
} from "./types";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const PROFILE_ORDER_COLUMNS: Record<PlayerProfileOrder, string> = {
    uuid: "p.uuid",
    level: "p.level",
    xp: "p.xp",
    coins: "p.coins",
};

function normalizeUuid(uuid: string): string {
    const normalized = uuid.trim().toLowerCase();

    if (!normalized) {
        throw new Error("Player UUID cannot be empty");
    }

    /*
     * Accetta UUID Minecraft con o senza trattini.
     */
    const compact = normalized.replaceAll("-", "");

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

function normalizeInteger(
    value: number,
    minimum: number,
    maximum: number,
    fallback: number,
): number {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(
        maximum,
        Math.max(minimum, Math.trunc(value)),
    );
}

function normalizePagination(
    options: PaginationOptions = {},
): Required<PaginationOptions> {
    return {
        limit: normalizeInteger(
            options.limit ?? DEFAULT_LIMIT,
            1,
            MAX_LIMIT,
            DEFAULT_LIMIT,
        ),
        offset: normalizeInteger(
            options.offset ?? 0,
            0,
            Number.MAX_SAFE_INTEGER,
            0,
        ),
    };
}

function normalizeNonNegative(value: unknown): number {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return 0;
    }

    return Math.max(0, Math.trunc(numericValue));
}

function normalizeLevel(value: unknown): number {
    return Math.max(1, normalizeNonNegative(value));
}

function mapBaseProfile(row: PlayerRow): PlayerBaseProfile {
    return {
        uuid: row.uuid,
        level: normalizeLevel(row.level),
        xp: normalizeNonNegative(row.xp),
        coins: normalizeNonNegative(row.coins),
        lastRewardClaimedLevel: normalizeNonNegative(
            row.last_reward_claimed_level,
        ),
    };
}

function mapModeStats(
    rows: readonly PlayerModeStatRow[],
): PlayerModeStats {
    const result: PlayerModeStats = {};

    for (const row of rows) {
        if (!isGameMode(row.mode) || !isPlayerStat(row.stat)) {
            continue;
        }

        const currentStats =
            result[row.mode] ?? createEmptyPlayerStats();

        currentStats[row.stat] = normalizeNonNegative(row.value);
        result[row.mode] = currentStats;
    }

    return result;
}

function mapGlobalStats(
    rows: readonly PlayerGlobalStatRow[],
): PlayerStats {
    const result = createEmptyPlayerStats();

    for (const row of rows) {
        if (!isPlayerStat(row.stat)) {
            continue;
        }

        result[row.stat] = normalizeNonNegative(row.value);
    }

    return result;
}

function mapSettings(
    rows: readonly PlayerSettingRow[],
): PlayerSettings {
    const settings = createDefaultPlayerSettings();

    for (const row of rows) {
        if (!isPlayerSetting(row.setting)) {
            continue;
        }

        settings[row.setting] = Boolean(row.enabled);
    }

    return settings;
}

function getDefaultStats(
    modeStats: PlayerModeStats,
    globalStats: PlayerStats,
): PlayerStats {
    /*
     * Replica la logica del PlayersDAO:
     *
     * - player_mode_stats/DEFAULT è la sorgente principale;
     * - player_stats_global è soltanto il fallback per i vecchi dati.
     */
    const defaultModeStats = modeStats.DEFAULT;

    if (defaultModeStats) {
        return defaultModeStats;
    }

    return globalStats;
}

function hasAnyModeStat(
    rows: readonly PlayerModeStatRow[],
    mode: GameMode,
): boolean {
    return rows.some(
        (row) =>
            row.mode === mode &&
            isPlayerStat(row.stat),
    );
}

export async function playerExists(uuid: string): Promise<boolean> {
    const normalizedUuid = normalizeUuid(uuid);

    const rows = await queryFb<PlayerCountRow[]>(
        `
            SELECT COUNT(*) AS total
            FROM players
            WHERE uuid = ?
        `,
        [normalizedUuid],
    );

    return Number(rows[0]?.total ?? 0) > 0;
}

export async function getPlayerBaseProfile(
    uuid: string,
): Promise<PlayerBaseProfile | null> {
    const normalizedUuid = normalizeUuid(uuid);

    const rows = await queryFb<PlayerRow[]>(
        `
            SELECT
                uuid,
                level,
                xp,
                coins,
                last_reward_claimed_level
            FROM players
            WHERE uuid = ?
            LIMIT 1
        `,
        [normalizedUuid],
    );

    const row = rows[0];

    return row ? mapBaseProfile(row) : null;
}

export async function getPlayerProfile(
    uuid: string,
): Promise<PlayerProfile | null> {
    const normalizedUuid = normalizeUuid(uuid);

    const [
        playerRows,
        modeStatRows,
        globalStatRows,
        settingRows,
    ] = await Promise.all([
        queryFb<PlayerRow[]>(
            `
                SELECT
                    uuid,
                    level,
                    xp,
                    coins,
                    last_reward_claimed_level
                FROM players
                WHERE uuid = ?
                LIMIT 1
            `,
            [normalizedUuid],
        ),

        queryFb<PlayerModeStatRow[]>(
            `
                SELECT
                    uuid,
                    mode,
                    stat,
                    value
                FROM player_mode_stats
                WHERE uuid = ?
            `,
            [normalizedUuid],
        ),

        queryFb<PlayerGlobalStatRow[]>(
            `
                SELECT
                    uuid,
                    stat,
                    value
                FROM player_stats_global
                WHERE uuid = ?
            `,
            [normalizedUuid],
        ),

        queryFb<PlayerSettingRow[]>(
            `
                SELECT
                    uuid,
                    setting,
                    enabled
                FROM player_settings
                WHERE uuid = ?
            `,
            [normalizedUuid],
        ),
    ]);

    const playerRow = playerRows[0];

    if (!playerRow) {
        return null;
    }

    const modeStats = mapModeStats(modeStatRows);
    const legacyGlobalStats = mapGlobalStats(globalStatRows);
    const globalStats = getDefaultStats(
        modeStats,
        legacyGlobalStats,
    );

    /*
     * Garantisce che DEFAULT sia sempre disponibile anche quando
     * le statistiche provengono dalla vecchia tabella globale.
     */
    if (!modeStats.DEFAULT) {
        modeStats.DEFAULT = globalStats;
    }

    return {
        ...mapBaseProfile(playerRow),
        globalStats,
        modeStats,
        settings: mapSettings(settingRows),
    };
}

export async function getPlayerStats(
    uuid: string,
    mode: GameMode = "DEFAULT",
): Promise<PlayerStats | null> {
    const normalizedUuid = normalizeUuid(uuid);

    if (!isGameMode(mode)) {
        throw new Error(`Invalid game mode: ${mode}`);
    }

    const exists = await playerExists(normalizedUuid);

    if (!exists) {
        return null;
    }

    const modeRows = await queryFb<PlayerModeStatRow[]>(
        `
            SELECT
                uuid,
                mode,
                stat,
                value
            FROM player_mode_stats
            WHERE uuid = ?
              AND mode = ?
        `,
        [normalizedUuid, mode],
    );

    if (hasAnyModeStat(modeRows, mode)) {
        return mapModeStats(modeRows)[mode] ?? createEmptyPlayerStats();
    }

    /*
     * La tabella player_stats_global rappresenta soltanto DEFAULT.
     * Non deve essere usata come fallback per LEAGUE, RANKED ecc.
     */
    if (mode !== "DEFAULT") {
        return createEmptyPlayerStats();
    }

    const legacyRows = await queryFb<PlayerGlobalStatRow[]>(
        `
            SELECT
                uuid,
                stat,
                value
            FROM player_stats_global
            WHERE uuid = ?
        `,
        [normalizedUuid],
    );

    return mapGlobalStats(legacyRows);
}

export async function getPlayerSettings(
    uuid: string,
): Promise<PlayerSettings | null> {
    const normalizedUuid = normalizeUuid(uuid);

    const exists = await playerExists(normalizedUuid);

    if (!exists) {
        return null;
    }

    const rows = await queryFb<PlayerSettingRow[]>(
        `
            SELECT
                uuid,
                setting,
                enabled
            FROM player_settings
            WHERE uuid = ?
        `,
        [normalizedUuid],
    );

    return mapSettings(rows);
}

export async function getPlayers(
    options: PlayerSearchOptions = {},
): Promise<PaginatedResult<PlayerBaseProfile>> {
    const { limit, offset } = normalizePagination(options);

    const minimumLevel = normalizeInteger(
        options.minimumLevel ?? 1,
        1,
        Number.MAX_SAFE_INTEGER,
        1,
    );

    const orderBy: PlayerProfileOrder =
        options.orderBy ?? "level";

    const direction: SortDirection =
        options.orderDirection === "asc" ? "asc" : "desc";

    const orderColumn = PROFILE_ORDER_COLUMNS[orderBy];
    const sqlDirection =
        direction === "asc" ? "ASC" : "DESC";

    /*
     * limit e offset sono già normalizzati come interi,
     * quindi possono essere inseriti direttamente nella query.
     *
     * Evitiamo i placeholder per LIMIT/OFFSET perché alcune
     * versioni/configurazioni MySQL o MariaDB restituiscono:
     * "Incorrect arguments to mysqld_stmt_execute".
     */
    const [playerRows, countRows] = await Promise.all([
        queryFb<PlayerRow[]>(
            `
                SELECT
                    p.uuid,
                    p.level,
                    p.xp,
                    p.coins,
                    p.last_reward_claimed_level
                FROM players AS p
                WHERE p.level >= ?
                ORDER BY ${orderColumn} ${sqlDirection}, p.uuid ASC
                LIMIT ${limit}
                OFFSET ${offset}
            `,
            [minimumLevel],
        ),

        queryFb<PlayerCountRow[]>(
            `
                SELECT COUNT(*) AS total
                FROM players
                WHERE level >= ?
            `,
            [minimumLevel],
        ),
    ]);

    return {
        data: playerRows.map(mapBaseProfile),
        total: normalizeNonNegative(
            countRows[0]?.total,
        ),
        limit,
        offset,
    };
}
export async function getTopPlayersByStat(
    stat: PlayerStat,
    mode: GameMode = "DEFAULT",
    options: PaginationOptions = {},
): Promise<PaginatedResult<PlayerLeaderboardEntry>> {
    if (!isPlayerStat(stat)) {
        throw new Error(`Invalid player stat: ${stat}`);
    }

    if (!isGameMode(mode)) {
        throw new Error(`Invalid game mode: ${mode}`);
    }

    const { limit, offset } = normalizePagination(options);

    /*
     * Per DEFAULT usiamo player_mode_stats come sorgente principale.
     * player_stats_global viene usata soltanto quando il giocatore
     * non possiede alcuna riga DEFAULT nella nuova tabella.
     */
    if (mode === "DEFAULT") {
        const [rows, countRows] = await Promise.all([
            queryFb<PlayerLeaderboardRow[]>(
                `
                    SELECT
                        p.uuid,
                        p.level,
                        p.xp,
                        p.coins,
                        COALESCE(ms.value, gs.value, 0) AS value
                    FROM players AS p

                    LEFT JOIN player_mode_stats AS ms
                        ON ms.uuid = p.uuid
                       AND ms.mode = 'DEFAULT'
                       AND ms.stat = ?

                    LEFT JOIN player_stats_global AS gs
                        ON gs.uuid = p.uuid
                       AND gs.stat = ?
                       AND NOT EXISTS (
                           SELECT 1
                           FROM player_mode_stats AS existing_default
                           WHERE existing_default.uuid = p.uuid
                             AND existing_default.mode = 'DEFAULT'
                       )

                    WHERE COALESCE(ms.value, gs.value, 0) > 0
                    ORDER BY
                        value DESC,
                        p.level DESC,
                        p.xp DESC,
                        p.uuid ASC
                    LIMIT ?
                    OFFSET ?
                `,
                [stat, stat, limit, offset],
            ),

            queryFb<PlayerCountRow[]>(
                `
                    SELECT COUNT(*) AS total
                    FROM players AS p

                    LEFT JOIN player_mode_stats AS ms
                        ON ms.uuid = p.uuid
                       AND ms.mode = 'DEFAULT'
                       AND ms.stat = ?

                    LEFT JOIN player_stats_global AS gs
                        ON gs.uuid = p.uuid
                       AND gs.stat = ?
                       AND NOT EXISTS (
                           SELECT 1
                           FROM player_mode_stats AS existing_default
                           WHERE existing_default.uuid = p.uuid
                             AND existing_default.mode = 'DEFAULT'
                       )

                    WHERE COALESCE(ms.value, gs.value, 0) > 0
                `,
                [stat, stat],
            ),
        ]);

        return {
            data: rows.map((row, index) => ({
                uuid: row.uuid,
                level: normalizeLevel(row.level),
                xp: normalizeNonNegative(row.xp),
                coins: normalizeNonNegative(row.coins),
                lastRewardClaimedLevel: 0,
                stat,
                mode,
                value: normalizeNonNegative(row.value),
                position: offset + index + 1,
            })),
            total: normalizeNonNegative(countRows[0]?.total),
            limit,
            offset,
        };
    }

    const [rows, countRows] = await Promise.all([
        queryFb<PlayerLeaderboardRow[]>(
            `
                SELECT
                    p.uuid,
                    p.level,
                    p.xp,
                    p.coins,
                    ms.value
                FROM player_mode_stats AS ms
                INNER JOIN players AS p
                    ON p.uuid = ms.uuid
                WHERE ms.mode = ?
                  AND ms.stat = ?
                  AND ms.value > 0
                ORDER BY
                    ms.value DESC,
                    p.level DESC,
                    p.xp DESC,
                    p.uuid ASC
                LIMIT ?
                OFFSET ?
            `,
            [mode, stat, limit, offset],
        ),

        queryFb<PlayerCountRow[]>(
            `
                SELECT COUNT(*) AS total
                FROM player_mode_stats
                WHERE mode = ?
                  AND stat = ?
                  AND value > 0
            `,
            [mode, stat],
        ),
    ]);

    return {
        data: rows.map((row, index) => ({
            uuid: row.uuid,
            level: normalizeLevel(row.level),
            xp: normalizeNonNegative(row.xp),
            coins: normalizeNonNegative(row.coins),
            lastRewardClaimedLevel: 0,
            stat,
            mode,
            value: normalizeNonNegative(row.value),
            position: offset + index + 1,
        })),
        total: normalizeNonNegative(countRows[0]?.total),
        limit,
        offset,
    };
}

export async function getTopPlayersByLevel(
    options: PaginationOptions = {},
): Promise<PaginatedResult<PlayerBaseProfile>> {
    return getPlayers({
        ...options,
        orderBy: "level",
        orderDirection: "desc",
    });
}

export async function getTopPlayersByCoins(
    options: PaginationOptions = {},
): Promise<PaginatedResult<PlayerBaseProfile>> {
    return getPlayers({
        ...options,
        orderBy: "coins",
        orderDirection: "desc",
    });
}

export async function getPlayerProfileSummary(
    uuid: string,
): Promise<PlayerProfileSummary | null> {
    const profile = await getPlayerProfile(uuid);

    if (!profile) {
        return null;
    }

    const stats = profile.globalStats;

    return {
        uuid: profile.uuid,
        level: profile.level,
        xp: profile.xp,
        coins: profile.coins,
        lastRewardClaimedLevel: profile.lastRewardClaimedLevel,
        matchesPlayed: stats.MATCHES_PLAYED,
        wins: stats.WINS,
        draws: stats.DRAWS,
        losses: stats.LOSSES,
        goals: stats.GOALS,
        assists: stats.ASSISTS,
        saves: stats.SAVES,
    };
}

/*
 * Esportazioni utili per route e validazione dei parametri API.
 */

export {
    GAME_MODES,
    PLAYER_SETTINGS,
    PLAYER_STATS,
};
