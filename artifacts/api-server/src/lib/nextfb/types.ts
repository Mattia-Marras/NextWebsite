import type { RowDataPacket } from "mysql2";

import type { CasinoPlayerStats } from "./casino";
import type { PlayerCosmetics } from "./cosmetics";
import type { LeaguePlayerStatistics } from "./leagues";
import type { RankedProfile } from "./ranked";
import type { PlayerLeagueHistoryView } from "./league-history";

/*
 * Valori salvati dal plugin Java tramite Enum.name().
 * Devono quindi restare scritti esattamente in questo modo.
 */

export const GAME_MODES = [
    "DEFAULT",
    "LEAGUE",
    "RANKED",
    "TRAINING",
    "PLAYOFF",
    "SCRIM",
    "MINITOURNEY",
    "NOHIT",
    "HEATSEEKER",
    "VOLLEYBALL",
    "DODGEBALL",
] as const;

export type GameMode = (typeof GAME_MODES)[number];

export const PLAYER_STATS = [
    "GOALS",
    "PASSES",
    "SHOTS_ON_NET",
    "ASSISTS",
    "SAVES",
    "WINS",
    "DRAWS",
    "LOSSES",
    "MATCHES_PLAYED",
] as const;

export type PlayerStat = (typeof PLAYER_STATS)[number];

export const PLAYER_SETTINGS = [
    "SKINS",
    "MOVEMENT_TRAILS",
    "BALL_TRAILS",
    "PARTICLES",
    "HATS",
    "ACCESSORIES",
] as const;

export type PlayerSetting = (typeof PLAYER_SETTINGS)[number];

export type PlayerStats = Record<PlayerStat, number>;
export type PlayerSettings = Record<PlayerSetting, boolean>;

export type PlayerModeStats = Partial<
    Record<GameMode, PlayerStats>
>;

/*
 * Righe restituite direttamente da MySQL.
 */

export interface PlayerRow extends RowDataPacket {
    uuid: string;
    level: number;
    xp: number;
    coins: number;
    last_reward_claimed_level: number;
}

export interface PlayerGlobalStatRow extends RowDataPacket {
    uuid: string;
    stat: string;
    value: number;
}

export interface PlayerModeStatRow extends RowDataPacket {
    uuid: string;
    mode: string;
    stat: string;
    value: number;
}

export interface PlayerSettingRow extends RowDataPacket {
    uuid: string;
    setting: string;
    enabled: number | boolean;
}

export interface PlayerCosmeticRow extends RowDataPacket {
    uuid: string;
    cosmetic_id: string;
}

export interface PlayerLeaderboardRow extends RowDataPacket {
    uuid: string;
    value: number;
    level: number;
    xp: number;
    coins: number;
}

export interface PlayerCountRow extends RowDataPacket {
    total: number;
}

/*
 * Oggetti restituiti dai metodi DAO al resto del backend.
 */

export interface PlayerBaseProfile {
    uuid: string;
    level: number;
    xp: number;
    coins: number;
    lastRewardClaimedLevel: number;
}

export interface PlayerProfile extends PlayerBaseProfile {
    globalStats: PlayerStats;
    modeStats: PlayerModeStats;
    settings: PlayerSettings;
}

export interface PlayerProfileWithCosmetics
    extends PlayerProfile {
    availableCosmetics: string[];
    activeCosmetics: string[];
}

export interface PlayerProfileSummary
    extends PlayerBaseProfile {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    assists: number;
    saves: number;
}

export interface PlayerLeaderboardEntry
    extends PlayerBaseProfile {
    stat: PlayerStat;
    mode: GameMode;
    value: number;
    position: number;
}

/*
 * Dati league appartenenti a un singolo giocatore.
 *
 * Un array viene usato perché lo stesso giocatore può avere
 * statistiche in più leghe o stagioni.
 */

export interface PlayerLeagueProfile {
    leagueId: number;
    leagueName: string;
    statistics: LeaguePlayerStatistics;
}

/*
 * Oggetto aggregato utilizzato dalla pagina pubblica
 * di un giocatore NextFootball.
 */

export interface NextFootballPlayerPage {
    profile: PlayerProfile;
    ranked: RankedProfile | null;
    leagues: PlayerLeagueProfile[];
    casino: CasinoPlayerStats | null;
    cosmetics: PlayerCosmetics;
    leagueHistory: PlayerLeagueHistoryView;
}

/*
 * Paginazione e ordinamento.
 */

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

export interface PlayerSearchOptions
    extends PaginationOptions {
    minimumLevel?: number;
    orderBy?: PlayerProfileOrder;
    orderDirection?: SortDirection;
}

export type PlayerProfileOrder =
    | "level"
    | "xp"
    | "coins"
    | "uuid";

export type SortDirection = "asc" | "desc";

/*
 * Utility di validazione.
 */

export function isGameMode(
    value: string,
): value is GameMode {
    return (GAME_MODES as readonly string[]).includes(value);
}

export function isPlayerStat(
    value: string,
): value is PlayerStat {
    return (PLAYER_STATS as readonly string[]).includes(value);
}

export function isPlayerSetting(
    value: string,
): value is PlayerSetting {
    return (PLAYER_SETTINGS as readonly string[]).includes(value);
}

export function createEmptyPlayerStats(): PlayerStats {
    return {
        GOALS: 0,
        PASSES: 0,
        SHOTS_ON_NET: 0,
        ASSISTS: 0,
        SAVES: 0,
        WINS: 0,
        DRAWS: 0,
        LOSSES: 0,
        MATCHES_PLAYED: 0,
    };
}

export function createDefaultPlayerSettings(): PlayerSettings {
    /*
     * Nel Profile Java, un'impostazione assente
     * viene letta come true.
     */
    return {
        SKINS: true,
        MOVEMENT_TRAILS: true,
        BALL_TRAILS: true,
        PARTICLES: true,
        HATS: true,
        ACCESSORIES: true,
    };
}
