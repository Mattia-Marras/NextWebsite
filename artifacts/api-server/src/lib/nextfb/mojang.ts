export interface MojangPlayer {
  uuid: string;
  username: string;
}

interface MojangApiResponse {
  id: string;
  name: string;
}

interface PlayerDbResponse {
  code?: string;
  message?: string;
  success?: boolean;
  data?: {
    player?: {
      username?: string;
      id?: string;
      raw_id?: string;
      avatar?: string;
    };
  };
}

interface CachedMinecraftPlayer {
  player: MojangPlayer | null;
  expiresAt: number;
}

const MOJANG_API =
  "https://api.mojang.com/users/profiles/minecraft";

const PLAYERDB_API =
  "https://playerdb.co/api/player/minecraft";

const REQUEST_TIMEOUT_MS = 7000;

/*
 * I risultati validi restano in cache per 12 ore.
 * I risultati nulli restano in cache meno tempo, così un errore
 * temporaneo non nasconde troppo a lungo un giocatore valido.
 */
const PROFILE_CACHE_TTL_MS =
  12 * 60 * 60 * 1000;

const MISSING_PROFILE_CACHE_TTL_MS =
  15 * 60 * 1000;

/*
 * Evita di inviare tutte le richieste della leaderboard
 * contemporaneamente a PlayerDB.
 */
const BATCH_CONCURRENCY = 5;

const playerByUuidCache = new Map<
  string,
  CachedMinecraftPlayer
>();

const playerByUsernameCache = new Map<
  string,
  CachedMinecraftPlayer
>();

class ExternalProfileServiceError extends Error {
  public readonly provider: "mojang" | "playerdb";
  public readonly status: number | null;

  public constructor(
    provider: "mojang" | "playerdb",
    message: string,
    status: number | null = null,
  ) {
    super(message);

    this.name = "ExternalProfileServiceError";
    this.provider = provider;
    this.status = status;
  }
}

/**
 * Verifica e normalizza uno username Minecraft Java.
 */
export function normalizeMinecraftUsername(
  rawUsername: string,
): string {
  const username = rawUsername.trim();

  if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
    throw new Error(
      `Invalid Minecraft username: ${rawUsername}`,
    );
  }

  return username;
}

/**
 * Normalizza un UUID Minecraft nel formato con trattini.
 */
export function formatUuid(rawUuid: string): string {
  const compactUuid = rawUuid
    .trim()
    .toLowerCase()
    .replaceAll("-", "");

  if (!/^[0-9a-f]{32}$/.test(compactUuid)) {
    throw new Error(
      `Invalid Minecraft UUID returned by provider: ${rawUuid}`,
    );
  }

  return [
    compactUuid.slice(0, 8),
    compactUuid.slice(8, 12),
    compactUuid.slice(12, 16),
    compactUuid.slice(16, 20),
    compactUuid.slice(20),
  ].join("-");
}

/**
 * Verifica e normalizza un UUID ricevuto dal sito/database.
 */
function normalizeMinecraftUuid(
  rawUuid: string,
): string {
  try {
    return formatUuid(rawUuid);
  } catch {
    throw new Error(
      `Invalid Minecraft UUID: ${rawUuid}`,
    );
  }
}

function normalizeUsernameCacheKey(
  username: string,
): string {
  return username.trim().toLowerCase();
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "AbortError"
  );
}

function shouldUseFallback(error: unknown): boolean {
  if (isAbortError(error)) {
    return true;
  }

  if (error instanceof TypeError) {
    /*
     * fetch() usa spesso TypeError per errori DNS,
     * TLS, rete o connessione.
     */
    return true;
  }

  if (
    error instanceof ExternalProfileServiceError &&
    error.provider === "mojang"
  ) {
    return (
      error.status === 403 ||
      error.status === 408 ||
      error.status === 429 ||
      error.status === null ||
      error.status >= 500
    );
  }

  return false;
}

function getCachedPlayer(
  cache: Map<string, CachedMinecraftPlayer>,
  key: string,
): MojangPlayer | null | undefined {
  const cached = cache.get(key);

  if (!cached) {
    return undefined;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return cached.player;
}

function cachePlayer(
  player: MojangPlayer,
): void {
  const expiresAt =
    Date.now() + PROFILE_CACHE_TTL_MS;

  playerByUuidCache.set(player.uuid, {
    player,
    expiresAt,
  });

  playerByUsernameCache.set(
    normalizeUsernameCacheKey(player.username),
    {
      player,
      expiresAt,
    },
  );
}

function cacheMissingUuid(uuid: string): void {
  playerByUuidCache.set(uuid, {
    player: null,
    expiresAt:
      Date.now() + MISSING_PROFILE_CACHE_TTL_MS,
  });
}

function cacheMissingUsername(
  username: string,
): void {
  playerByUsernameCache.set(
    normalizeUsernameCacheKey(username),
    {
      player: null,
      expiresAt:
        Date.now() + MISSING_PROFILE_CACHE_TTL_MS,
    },
  );
}

async function fetchWithTimeout(
  url: string,
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "NextFootball-Website/1.0 (+https://nextfootball.net)",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parsePlayerDbResponse(
  json: PlayerDbResponse,
  responseStatus: number,
): MojangPlayer | null {
  /*
   * PlayerDB può rispondere HTTP 200 con success=false.
   */
  if (json.success === false) {
    const message =
      json.message?.toLowerCase() ?? "";

    if (
      message.includes("not found") ||
      message.includes("invalid player") ||
      message.includes("unknown player")
    ) {
      return null;
    }

    throw new ExternalProfileServiceError(
      "playerdb",
      json.message ?? "PlayerDB request failed",
      responseStatus,
    );
  }

  const player = json.data?.player;

  const returnedUsername = player?.username;
  const returnedUuid =
    player?.id ?? player?.raw_id;

  if (
    typeof returnedUsername !== "string" ||
    typeof returnedUuid !== "string"
  ) {
    throw new ExternalProfileServiceError(
      "playerdb",
      "PlayerDB returned an invalid response",
      responseStatus,
    );
  }

  return {
    uuid: formatUuid(returnedUuid),
    username: returnedUsername,
  };
}

/**
 * Primo provider per username: API Mojang.
 */
async function resolveFromMojang(
  username: string,
): Promise<MojangPlayer | null> {
  let response: Response;

  try {
    response = await fetchWithTimeout(
      `${MOJANG_API}/${encodeURIComponent(username)}`,
    );
  } catch (error) {
    if (isAbortError(error)) {
      throw new ExternalProfileServiceError(
        "mojang",
        "Mojang API request timed out",
        408,
      );
    }

    throw error;
  }

  if (
    response.status === 204 ||
    response.status === 404
  ) {
    return null;
  }

  if (!response.ok) {
    throw new ExternalProfileServiceError(
      "mojang",
      `Mojang API returned HTTP ${response.status}`,
      response.status,
    );
  }

  const json = (await response.json()) as unknown;

  if (
    typeof json !== "object" ||
    json === null ||
    !("id" in json) ||
    !("name" in json) ||
    typeof json.id !== "string" ||
    typeof json.name !== "string"
  ) {
    throw new ExternalProfileServiceError(
      "mojang",
      "Mojang API returned an invalid response",
      response.status,
    );
  }

  const profile = json as MojangApiResponse;

  return {
    uuid: formatUuid(profile.id),
    username: profile.name,
  };
}

/**
 * PlayerDB può ricevere sia username sia UUID.
 */
async function resolveFromPlayerDb(
  identifier: string,
): Promise<MojangPlayer | null> {
  let response: Response;

  try {
    response = await fetchWithTimeout(
      `${PLAYERDB_API}/${encodeURIComponent(identifier)}`,
    );
  } catch (error) {
    if (isAbortError(error)) {
      throw new ExternalProfileServiceError(
        "playerdb",
        "PlayerDB request timed out",
        408,
      );
    }

    throw error;
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new ExternalProfileServiceError(
      "playerdb",
      `PlayerDB returned HTTP ${response.status}`,
      response.status,
    );
  }

  const json =
    (await response.json()) as PlayerDbResponse;

  return parsePlayerDbResponse(
    json,
    response.status,
  );
}

/**
 * Risolve uno username Minecraft in UUID.
 *
 * Ordine:
 * 1. cache
 * 2. Mojang
 * 3. PlayerDB come fallback
 */
export async function resolveMinecraftPlayer(
  rawUsername: string,
): Promise<MojangPlayer | null> {
  const username =
    normalizeMinecraftUsername(rawUsername);

  const cacheKey =
    normalizeUsernameCacheKey(username);

  const cached = getCachedPlayer(
    playerByUsernameCache,
    cacheKey,
  );

  if (cached !== undefined) {
    return cached;
  }

  try {
    const player =
      await resolveFromMojang(username);

    if (!player) {
      cacheMissingUsername(username);
      return null;
    }

    cachePlayer(player);
    return player;
  } catch (mojangError) {
    if (!shouldUseFallback(mojangError)) {
      throw mojangError;
    }

    console.warn(
      `[NextFootball] Mojang lookup failed for "${username}". Falling back to PlayerDB.`,
      mojangError,
    );

    const player =
      await resolveFromPlayerDb(username);

    if (!player) {
      cacheMissingUsername(username);
      return null;
    }

    cachePlayer(player);
    return player;
  }
}

/**
 * Risolve un UUID Minecraft in username tramite PlayerDB.
 *
 * Usata principalmente dalle leaderboard.
 */
export async function resolveMinecraftPlayerByUuid(
  rawUuid: string,
): Promise<MojangPlayer | null> {
  const uuid =
    normalizeMinecraftUuid(rawUuid);

  const cached = getCachedPlayer(
    playerByUuidCache,
    uuid,
  );

  if (cached !== undefined) {
    return cached;
  }

  const player =
    await resolveFromPlayerDb(uuid);

  if (!player) {
    cacheMissingUuid(uuid);
    return null;
  }

  /*
   * Controllo difensivo: PlayerDB deve aver restituito
   * lo stesso account richiesto.
   */
  if (player.uuid !== uuid) {
    throw new ExternalProfileServiceError(
      "playerdb",
      `PlayerDB returned UUID ${player.uuid} while resolving ${uuid}`,
    );
  }

  cachePlayer(player);
  return player;
}

/**
 * Risolve più UUID per le leaderboard.
 *
 * Restituisce una Map indicizzata tramite UUID normalizzato.
 * Un errore relativo a un singolo giocatore non blocca
 * l'intera leaderboard.
 */
export async function resolveMinecraftPlayersByUuids(
  rawUuids: string[],
): Promise<Map<string, MojangPlayer | null>> {
  const uniqueUuids = [
    ...new Set(
      rawUuids.map((uuid) =>
        normalizeMinecraftUuid(uuid),
      ),
    ),
  ];

  const results = new Map<
    string,
    MojangPlayer | null
  >();

  for (
    let index = 0;
    index < uniqueUuids.length;
    index += BATCH_CONCURRENCY
  ) {
    const batch = uniqueUuids.slice(
      index,
      index + BATCH_CONCURRENCY,
    );

    const batchResults = await Promise.all(
      batch.map(async (uuid) => {
        try {
          const player =
            await resolveMinecraftPlayerByUuid(uuid);

          return [uuid, player] as const;
        } catch (error) {
          console.warn(
            `[NextFootball] Unable to resolve username for UUID "${uuid}".`,
            error,
          );

          return [uuid, null] as const;
        }
      }),
    );

    for (const [uuid, player] of batchResults) {
      results.set(uuid, player);
    }
  }

  return results;
}