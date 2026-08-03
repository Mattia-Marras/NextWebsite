import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import {
  getCasinoHouseStats,
  getCasinoLeaderboard,
  type CasinoLeaderboardMetric,
} from "../lib/nextfb/casino";

import {
  getMostPopularCosmetics,
  isCosmeticType,
  type CosmeticType,
} from "../lib/nextfb/cosmetics";

import {
  getLeagueById,
  getLeaguePlayerLeaderboard,
  getLeagues,
  isLeaguePlayerStat,
} from "../lib/nextfb/leagues";

import {
  getPlayerPage,
} from "../lib/nextfb/player";

import {
  getPlayers,
  getTopPlayersByCoins,
  getTopPlayersByLevel,
  getTopPlayersByStat,
} from "../lib/nextfb/profiles";

import {
  getPlayerMmrHistory,
  getRankedLeaderboard,
  getRankedStatLeaderboard,
  isRankedStat,
} from "../lib/nextfb/ranked";

import {
  isGameMode,
  isPlayerStat,
  type PaginationOptions,
  type PlayerProfileOrder,
  type SortDirection,
} from "../lib/nextfb/types";

export const nextFootballRouter = Router();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const CASINO_LEADERBOARD_METRICS = [
  "dailyPlays",
  "dailyBet",
  "dailyWon",
  "dailyLost",
  "totalPlays",
  "totalBet",
  "totalWon",
  "totalLost",
  "dailyNet",
  "totalNet",
] as const satisfies readonly CasinoLeaderboardMetric[];

const PLAYER_PROFILE_ORDERS = [
  "level",
  "xp",
  "coins",
  "uuid",
] as const satisfies readonly PlayerProfileOrder[];

class InvalidRequestError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidRequestError";
  }
}

type AsyncRouteHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<unknown>;

function asyncRoute(
  handler: AsyncRouteHandler,
): (
  request: Request,
  response: Response,
  next: NextFunction,
) => void {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}

function getSingleValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (
    Array.isArray(value) &&
    typeof value[0] === "string"
  ) {
    return value[0];
  }

  return undefined;
}

function getRouteParameter(
  value: string | string[] | undefined,
  name: string,
): string {
  const parameter = Array.isArray(value)
    ? value[0]
    : value;

  if (!parameter || parameter.trim() === "") {
    throw new InvalidRequestError(
      `Missing route parameter: ${name}`,
    );
  }

  return parameter.trim();
}

function parseInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const rawValue = getSingleValue(value);

  if (
    rawValue === undefined ||
    rawValue.trim() === ""
  ) {
    return fallback;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed)) {
    throw new InvalidRequestError(
      `Expected an integer, received: ${rawValue}`,
    );
  }

  if (parsed < minimum || parsed > maximum) {
    throw new InvalidRequestError(
      `Value must be between ${minimum} and ${maximum}`,
    );
  }

  return parsed;
}

function parseBoolean(
  value: unknown,
  fallback = false,
): boolean {
  const rawValue = getSingleValue(value);

  if (rawValue === undefined) {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0"
  ) {
    return false;
  }

  throw new InvalidRequestError(
    `Invalid boolean value: ${rawValue}`,
  );
}

function parsePagination(
  request: Request,
): PaginationOptions {
  return {
    limit: parseInteger(
      request.query.limit,
      DEFAULT_LIMIT,
      1,
      MAX_LIMIT,
    ),
    offset: parseInteger(
      request.query.offset,
      0,
      0,
      Number.MAX_SAFE_INTEGER,
    ),
  };
}

function normalizeUuid(rawUuid: string): string {
  const compact = rawUuid
    .trim()
    .toLowerCase()
    .replaceAll("-", "");

  if (!/^[0-9a-f]{32}$/.test(compact)) {
    throw new InvalidRequestError(
      `Invalid player UUID: ${rawUuid}`,
    );
  }

  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20),
  ].join("-");
}

function parsePositiveId(value: string): number {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    throw new InvalidRequestError(
      `Invalid positive ID: ${value}`,
    );
  }

  return parsed;
}

function isCasinoLeaderboardMetric(
  value: string,
): value is CasinoLeaderboardMetric {
  return (
    CASINO_LEADERBOARD_METRICS as readonly string[]
  ).includes(value);
}

function isPlayerProfileOrder(
  value: string,
): value is PlayerProfileOrder {
  return (
    PLAYER_PROFILE_ORDERS as readonly string[]
  ).includes(value);
}

/*
 * Profilo completo del singolo giocatore.
 *
 * GET /api/nextfb/players/:uuid
 */

nextFootballRouter.get(
  "/players/:uuid",
  asyncRoute(async (request, response) => {
    const uuid = normalizeUuid(
      getRouteParameter(
        request.params.uuid,
        "uuid",
      ),
    );

    const player = await getPlayerPage(uuid);

    if (!player) {
      return response.status(404).json({
        error: "PLAYER_NOT_FOUND",
        message: "NextFootball player not found",
      });
    }

    return response.status(200).json(player);
  }),
);

/*
 * Storico MMR del giocatore.
 *
 * GET /api/nextfb/players/:uuid/mmr-history
 */

nextFootballRouter.get(
  "/players/:uuid/mmr-history",
  asyncRoute(async (request, response) => {
    const uuid = normalizeUuid(
      getRouteParameter(
        request.params.uuid,
        "uuid",
      ),
    );

    const pagination = parsePagination(request);

    const history = await getPlayerMmrHistory(
      uuid,
      pagination,
    );

    return response.status(200).json(history);
  }),
);

/*
 * Lista generale dei profili.
 *
 * GET /api/nextfb/players
 */

nextFootballRouter.get(
  "/players",
  asyncRoute(async (request, response) => {
    const pagination = parsePagination(request);

    const minimumLevel = parseInteger(
      request.query.minimumLevel,
      1,
      1,
      Number.MAX_SAFE_INTEGER,
    );

    const rawOrderBy =
      getSingleValue(request.query.orderBy) ??
      "level";

    if (!isPlayerProfileOrder(rawOrderBy)) {
      throw new InvalidRequestError(
        `Invalid player order: ${rawOrderBy}`,
      );
    }

    const rawDirection =
      getSingleValue(
        request.query.orderDirection,
      ) ?? "desc";

    if (
      rawDirection !== "asc" &&
      rawDirection !== "desc"
    ) {
      throw new InvalidRequestError(
        `Invalid order direction: ${rawDirection}`,
      );
    }

    const orderDirection: SortDirection =
      rawDirection;

    const players = await getPlayers({
      ...pagination,
      minimumLevel,
      orderBy: rawOrderBy,
      orderDirection,
    });

    return response.status(200).json(players);
  }),
);

/*
 * Leaderboard livello.
 *
 * GET /api/nextfb/leaderboards/players/level
 */

nextFootballRouter.get(
  "/leaderboards/players/level",
  asyncRoute(async (request, response) => {
    const result = await getTopPlayersByLevel(
      parsePagination(request),
    );

    return response.status(200).json(result);
  }),
);

/*
 * Leaderboard monete.
 *
 * GET /api/nextfb/leaderboards/players/coins
 */

nextFootballRouter.get(
  "/leaderboards/players/coins",
  asyncRoute(async (request, response) => {
    const result = await getTopPlayersByCoins(
      parsePagination(request),
    );

    return response.status(200).json(result);
  }),
);

/*
 * Leaderboard statistiche generali per modalità.
 *
 * GET /api/nextfb/leaderboards/players/:mode/:stat
 */

nextFootballRouter.get(
  "/leaderboards/players/:mode/:stat",
  asyncRoute(async (request, response) => {
    const mode = getRouteParameter(
      request.params.mode,
      "mode",
    ).toUpperCase();

    const stat = getRouteParameter(
      request.params.stat,
      "stat",
    ).toUpperCase();

    if (!isGameMode(mode)) {
      throw new InvalidRequestError(
        `Invalid game mode: ${mode}`,
      );
    }

    if (!isPlayerStat(stat)) {
      throw new InvalidRequestError(
        `Invalid player stat: ${stat}`,
      );
    }

    const result = await getTopPlayersByStat(
      stat,
      mode,
      parsePagination(request),
    );

    return response.status(200).json(result);
  }),
);

/*
 * Leaderboard ranked ordinata per MMR.
 *
 * GET /api/nextfb/leaderboards/ranked
 */

nextFootballRouter.get(
  "/leaderboards/ranked",
  asyncRoute(async (request, response) => {
    const includeBanned = parseBoolean(
      request.query.includeBanned,
      false,
    );

    const result = await getRankedLeaderboard(
      parsePagination(request),
      includeBanned,
    );

    return response.status(200).json(result);
  }),
);

/*
 * Leaderboard ranked per statistica.
 *
 * GET /api/nextfb/leaderboards/ranked/stats/:stat
 */

nextFootballRouter.get(
  "/leaderboards/ranked/stats/:stat",
  asyncRoute(async (request, response) => {
    const stat = getRouteParameter(
      request.params.stat,
      "stat",
    ).toUpperCase();

    if (!isRankedStat(stat)) {
      throw new InvalidRequestError(
        `Invalid ranked stat: ${stat}`,
      );
    }

    const result =
      await getRankedStatLeaderboard(
        stat,
        parsePagination(request),
      );

    return response.status(200).json(result);
  }),
);

/*
 * Leaderboard casino.
 *
 * GET /api/nextfb/leaderboards/casino/:metric
 */

nextFootballRouter.get(
  "/leaderboards/casino/:metric",
  asyncRoute(async (request, response) => {
    const metric = getRouteParameter(
      request.params.metric,
      "metric",
    );

    if (!isCasinoLeaderboardMetric(metric)) {
      throw new InvalidRequestError(
        `Invalid casino metric: ${metric}`,
      );
    }

    const result = await getCasinoLeaderboard(
      metric,
      parsePagination(request),
    );

    return response.status(200).json(result);
  }),
);

/*
 * Statistiche globali del banco.
 *
 * GET /api/nextfb/casino/house
 */

nextFootballRouter.get(
  "/casino/house",
  asyncRoute(async (_request, response) => {
    const result = await getCasinoHouseStats();

    return response.status(200).json(result);
  }),
);

/*
 * Lista delle leghe.
 *
 * GET /api/nextfb/leagues
 */

nextFootballRouter.get(
  "/leagues",
  asyncRoute(async (_request, response) => {
    const leagues = await getLeagues();

    return response.status(200).json(leagues);
  }),
);

/*
 * Dettagli e classifica di una lega.
 *
 * GET /api/nextfb/leagues/:leagueId
 */

nextFootballRouter.get(
  "/leagues/:leagueId",
  asyncRoute(async (request, response) => {
    const leagueId = parsePositiveId(
      getRouteParameter(
        request.params.leagueId,
        "leagueId",
      ),
    );

    const league = await getLeagueById(leagueId);

    if (!league) {
      return response.status(404).json({
        error: "LEAGUE_NOT_FOUND",
        message: "NextFootball league not found",
      });
    }

    return response.status(200).json(league);
  }),
);

/*
 * Leaderboard giocatori di una lega.
 *
 * GET /api/nextfb/leagues/:leagueId/leaderboards/:stat
 */

nextFootballRouter.get(
  "/leagues/:leagueId/leaderboards/:stat",
  asyncRoute(async (request, response) => {
    const leagueId = parsePositiveId(
      getRouteParameter(
        request.params.leagueId,
        "leagueId",
      ),
    );

    const stat = getRouteParameter(
      request.params.stat,
      "stat",
    );

    if (!isLeaguePlayerStat(stat)) {
      throw new InvalidRequestError(
        `Invalid league player stat: ${stat}`,
      );
    }

    const result =
      await getLeaguePlayerLeaderboard(
        leagueId,
        stat,
        parsePagination(request),
      );

    return response.status(200).json(result);
  }),
);

/*
 * Classifica dei cosmetici più posseduti.
 *
 * GET /api/nextfb/cosmetics/popular
 */

nextFootballRouter.get(
  "/cosmetics/popular",
  asyncRoute(async (request, response) => {
    const rawType = getSingleValue(
      request.query.type,
    );

    let cosmeticType: CosmeticType | undefined;

    if (rawType !== undefined) {
      if (!isCosmeticType(rawType)) {
        throw new InvalidRequestError(
          `Invalid cosmetic type: ${rawType}`,
        );
      }

      cosmeticType = rawType;
    }

    const result =
      await getMostPopularCosmetics(
        parsePagination(request),
        cosmeticType,
      );

    return response.status(200).json(result);
  }),
);

/*
 * Gestione degli errori di validazione.
 */

nextFootballRouter.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    if (error instanceof InvalidRequestError) {
      return response.status(400).json({
        error: "INVALID_REQUEST",
        message: error.message,
      });
    }

    return next(error);
  },
);

export default nextFootballRouter;