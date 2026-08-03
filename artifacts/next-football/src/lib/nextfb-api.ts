/*
 * Client HTTP per le API pubbliche NextFootball.
 *
 * Questo file non accede direttamente a MySQL.
 * Comunica esclusivamente con il backend Express tramite /api/nextfb.
 */

const NEXTFB_API_BASE = "/api/nextfb";

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

/*
 * Identità Minecraft.
 *
 * username è opzionale perché:
 * - le leaderboard arricchite lo restituiscono;
 * - alcune risposte più vecchie o il profilo singolo
 *   potrebbero contenere soltanto l'UUID.
 */

export interface MinecraftPlayerIdentity {
  uuid: string;
  username?: string | null;
}

/*
 * Errori API
 */

export interface NextFootballApiErrorBody {
  error?: string;
  message?: string;
}

export class NextFootballApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(
    message: string,
    status: number,
    code: string | null = null,
  ) {
    super(message);

    this.name = "NextFootballApiError";
    this.status = status;
    this.code = code;
  }
}

/*
 * Profile
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

export type GameMode =
  (typeof GAME_MODES)[number];

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

export type PlayerStat =
  (typeof PLAYER_STATS)[number];

export const PLAYER_SETTINGS = [
  "SKINS",
  "MOVEMENT_TRAILS",
  "BALL_TRAILS",
  "PARTICLES",
  "HATS",
  "ACCESSORIES",
] as const;

export type PlayerSetting =
  (typeof PLAYER_SETTINGS)[number];

export type PlayerStats =
  Record<PlayerStat, number>;

export type PlayerSettings =
  Record<PlayerSetting, boolean>;

export type PlayerModeStats = Partial<
  Record<GameMode, PlayerStats>
>;

export interface PlayerBaseProfile
  extends MinecraftPlayerIdentity {
  level: number;
  xp: number;
  coins: number;
  lastRewardClaimedLevel: number;
}

export interface PlayerProfile
  extends PlayerBaseProfile {
  globalStats: PlayerStats;
  modeStats: PlayerModeStats;
  settings: PlayerSettings;
}

export interface ResolvedNextFootballPlayer {
  uuid: string;
  username: string;
  registered: true;
}

export interface PlayerLeaderboardEntry
  extends PlayerBaseProfile {
  stat: PlayerStat;
  mode: GameMode;
  value: number;
  position: number;
}

export type PlayerProfileOrder =
  | "level"
  | "xp"
  | "coins"
  | "uuid";

export type SortDirection =
  | "asc"
  | "desc";

export interface PlayerSearchOptions
  extends PaginationOptions {
  minimumLevel?: number;
  orderBy?: PlayerProfileOrder;
  orderDirection?: SortDirection;
}

/*
 * Ranked
 */

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

export type RankedStat =
  (typeof RANKED_STATS)[number];

export type RankedStats =
  Record<RankedStat, number>;

export type RankName =
  | "IRON"
  | "BRONZE"
  | "GOLD"
  | "EMERALD"
  | "PLATINUM"
  | "RUBY"
  | "DIAMOND"
  | "LEGEND"
  | "MYTHIC";

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

export interface RankedProfile
  extends MinecraftPlayerIdentity {
  mmr: number;
  wins: number;
  losses: number;
  banned: boolean;
  permanentBan: boolean;
  rankedBanUntil: number | null;
  rank: RankedRank;
  stats: RankedStats;
}

export interface RankedLeaderboardEntry
  extends RankedProfile {
  position: number;
}

export interface RankedStatLeaderboardEntry
  extends MinecraftPlayerIdentity {
  position: number;
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
  createdAt: string;
}

/*
 * League
 */

export const LEAGUE_PLAYER_STATS = [
  "goals",
  "assists",
  "passes",
  "shotsOnNet",
  "saves",
  "matchesPlayed",
] as const;

export type LeaguePlayerStat =
  (typeof LEAGUE_PLAYER_STATS)[number];

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
  username?: string | null;
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

export interface PlayerLeagueProfile {
  leagueId: number;
  leagueName: string;
  statistics: LeaguePlayerStatistics;
}

/*
 * Casino
 */

export interface CasinoPlayerStats
  extends MinecraftPlayerIdentity {
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

export interface CasinoLeaderboardEntry
  extends CasinoPlayerStats {
  position: number;
}

/*
 * Cosmetics
 */

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

export type CosmeticType =
  (typeof COSMETIC_TYPES)[number];

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

/*
 * Pagina aggregata del singolo giocatore.
 */

export interface NextFootballPlayerPage {
  profile: PlayerProfile;
  ranked: RankedProfile | null;
  leagues: PlayerLeagueProfile[];
  casino: CasinoPlayerStats | null;
  cosmetics: PlayerCosmetics;
}

/*
 * Utility interne.
 */

function addQueryParameter(
  parameters: URLSearchParams,
  name: string,
  value:
    | string
    | number
    | boolean
    | undefined,
): void {
  if (value === undefined) {
    return;
  }

  parameters.set(name, String(value));
}

function createQueryString(
  values: Record<
    string,
    | string
    | number
    | boolean
    | undefined
  >,
): string {
  const parameters =
    new URLSearchParams();

  for (
    const [name, value]
    of Object.entries(values)
  ) {
    addQueryParameter(
      parameters,
      name,
      value,
    );
  }

  const query = parameters.toString();

  return query ? `?${query}` : "";
}

async function readErrorBody(
  response: Response,
): Promise<
  NextFootballApiErrorBody | null
> {
  try {
    return (await response.json())
      as NextFootballApiErrorBody;
  } catch {
    return null;
  }
}

async function requestNextFootball<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${NEXTFB_API_BASE}${path}`,
    {
      ...options,
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
    },
  );

  if (!response.ok) {
    const errorBody =
      await readErrorBody(response);

    throw new NextFootballApiError(
      errorBody?.message ??
        `NextFootball API request failed with status ${response.status}`,
      response.status,
      errorBody?.error ?? null,
    );
  }

  return (await response.json()) as T;
}

/*
 * Player API
 */

export async function resolveNextFootballPlayer(
  username: string,
): Promise<ResolvedNextFootballPlayer> {
  const normalizedUsername =
    username.trim();

  if (!normalizedUsername) {
    throw new NextFootballApiError(
      "Minecraft username is required",
      400,
      "INVALID_REQUEST",
    );
  }

  return requestNextFootball<
    ResolvedNextFootballPlayer
  >(
    `/players/resolve/${encodeURIComponent(
      normalizedUsername,
    )}`,
  );
}

export async function getNextFootballPlayer(
  uuid: string,
): Promise<NextFootballPlayerPage> {
  return requestNextFootball<
    NextFootballPlayerPage
  >(
    `/players/${encodeURIComponent(uuid)}`,
  );
}

export async function getNextFootballPlayers(
  options: PlayerSearchOptions = {},
): Promise<
  PaginatedResult<PlayerBaseProfile>
> {
  const query = createQueryString({
    limit: options.limit,
    offset: options.offset,
    minimumLevel:
      options.minimumLevel,
    orderBy: options.orderBy,
    orderDirection:
      options.orderDirection,
  });

  return requestNextFootball<
    PaginatedResult<PlayerBaseProfile>
  >(`/players${query}`);
}

export async function getPlayerMmrHistory(
  uuid: string,
  options: PaginationOptions = {},
): Promise<
  PaginatedResult<MmrHistoryEntry>
> {
  const query = createQueryString({
    limit: options.limit,
    offset: options.offset,
  });

  return requestNextFootball<
    PaginatedResult<MmrHistoryEntry>
  >(
    `/players/${encodeURIComponent(
      uuid,
    )}/mmr-history${query}`,
  );
}

/*
 * Leaderboard profili.
 */

export async function getLevelLeaderboard(
  options: PaginationOptions = {},
): Promise<
  PaginatedResult<PlayerBaseProfile>
> {
  const query = createQueryString({
    limit: options.limit,
    offset: options.offset,
  });

  return requestNextFootball<
    PaginatedResult<PlayerBaseProfile>
  >(
    `/leaderboards/players/level${query}`,
  );
}

export async function getCoinsLeaderboard(
  options: PaginationOptions = {},
): Promise<
  PaginatedResult<PlayerBaseProfile>
> {
  const query = createQueryString({
    limit: options.limit,
    offset: options.offset,
  });

  return requestNextFootball<
    PaginatedResult<PlayerBaseProfile>
  >(
    `/leaderboards/players/coins${query}`,
  );
}

export async function getPlayerStatLeaderboard(
  mode: GameMode,
  stat: PlayerStat,
  options: PaginationOptions = {},
): Promise<
  PaginatedResult<PlayerLeaderboardEntry>
> {
  const query = createQueryString({
    limit: options.limit,
    offset: options.offset,
  });

  return requestNextFootball<
    PaginatedResult<PlayerLeaderboardEntry>
  >(
    `/leaderboards/players/${encodeURIComponent(
      mode,
    )}/${encodeURIComponent(
      stat,
    )}${query}`,
  );
}

/*
 * Ranked API
 */

export async function getRankedLeaderboard(
  options: PaginationOptions = {},
  includeBanned = false,
): Promise<
  PaginatedResult<RankedLeaderboardEntry>
> {
  const query = createQueryString({
    limit: options.limit,
    offset: options.offset,
    includeBanned,
  });

  return requestNextFootball<
    PaginatedResult<RankedLeaderboardEntry>
  >(`/leaderboards/ranked${query}`);
}

export async function getRankedStatLeaderboard(
  stat: RankedStat,
  options: PaginationOptions = {},
): Promise<
  PaginatedResult<
    RankedStatLeaderboardEntry
  >
> {
  const query = createQueryString({
    limit: options.limit,
    offset: options.offset,
  });

  return requestNextFootball<
    PaginatedResult<
      RankedStatLeaderboardEntry
    >
  >(
    `/leaderboards/ranked/stats/${encodeURIComponent(
      stat,
    )}${query}`,
  );
}

/*
 * League API
 */

export async function getNextFootballLeagues():
  Promise<LeagueSummary[]> {
  return requestNextFootball<
    LeagueSummary[]
  >("/leagues");
}

export async function getNextFootballLeague(
  leagueId: number,
): Promise<LeagueDetails> {
  return requestNextFootball<
    LeagueDetails
  >(`/leagues/${leagueId}`);
}

export async function getLeaguePlayerLeaderboard(
  leagueId: number,
  stat: LeaguePlayerStat,
  options: PaginationOptions = {},
): Promise<
  PaginatedResult<
    LeaguePlayerLeaderboardEntry
  >
> {
  const query = createQueryString({
    limit: options.limit,
    offset: options.offset,
  });

  return requestNextFootball<
    PaginatedResult<
      LeaguePlayerLeaderboardEntry
    >
  >(
    `/leagues/${leagueId}/leaderboards/${encodeURIComponent(
      stat,
    )}${query}`,
  );
}

/*
 * Casino API
 */

export async function getCasinoLeaderboard(
  metric:
    CasinoLeaderboardMetric =
      "totalWon",
  options: PaginationOptions = {},
): Promise<
  PaginatedResult<
    CasinoLeaderboardEntry
  >
> {
  const query = createQueryString({
    limit: options.limit,
    offset: options.offset,
  });

  return requestNextFootball<
    PaginatedResult<
      CasinoLeaderboardEntry
    >
  >(
    `/leaderboards/casino/${encodeURIComponent(
      metric,
    )}${query}`,
  );
}

export async function getCasinoHouseStats():
  Promise<CasinoHouseStats> {
  return requestNextFootball<
    CasinoHouseStats
  >("/casino/house");
}

/*
 * Cosmetics API
 */

export async function getPopularCosmetics(
  options: PaginationOptions = {},
  type?: CosmeticType,
): Promise<
  PaginatedResult<
    CosmeticPopularityEntry
  >
> {
  const query = createQueryString({
    limit: options.limit,
    offset: options.offset,
    type,
  });

  return requestNextFootball<
    PaginatedResult<
      CosmeticPopularityEntry
    >
  >(`/cosmetics/popular${query}`);
}