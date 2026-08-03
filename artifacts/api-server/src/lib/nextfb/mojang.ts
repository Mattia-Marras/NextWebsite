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

const MOJANG_API =
  "https://api.mojang.com/users/profiles/minecraft";

const PLAYERDB_API =
  "https://playerdb.co/api/player/minecraft";

const REQUEST_TIMEOUT_MS = 7000;

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
 * Normalizza un UUID Minecraft in formato con trattini.
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

/**
 * Primo provider: API Mojang.
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
 * Provider di fallback: PlayerDB.
 */
async function resolveFromPlayerDb(
  username: string,
): Promise<MojangPlayer | null> {
  let response: Response;

  try {
    response = await fetchWithTimeout(
      `${PLAYERDB_API}/${encodeURIComponent(username)}`,
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

  /*
   * PlayerDB può restituire HTTP 200 anche con success=false.
   */
  if (json.success === false) {
    const message =
      json.message?.toLowerCase() ?? "";

    if (
      message.includes("not found") ||
      message.includes("invalid player")
    ) {
      return null;
    }

    throw new ExternalProfileServiceError(
      "playerdb",
      json.message ?? "PlayerDB request failed",
      response.status,
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
      response.status,
    );
  }

  return {
    uuid: formatUuid(returnedUuid),
    username: returnedUsername,
  };
}

/**
 * Risolve uno username Minecraft.
 *
 * Ordine:
 * 1. Mojang
 * 2. PlayerDB in caso di blocco, timeout, rate limit
 *    o indisponibilità Mojang
 *
 * Restituisce null soltanto quando il giocatore non esiste.
 */
export async function resolveMinecraftPlayer(
  rawUsername: string,
): Promise<MojangPlayer | null> {
  const username =
    normalizeMinecraftUsername(rawUsername);

  try {
    return await resolveFromMojang(username);
  } catch (mojangError) {
    if (!shouldUseFallback(mojangError)) {
      throw mojangError;
    }

    console.warn(
      `[NextFootball] Mojang lookup failed for "${username}". Falling back to PlayerDB.`,
      mojangError,
    );

    return resolveFromPlayerDb(username);
  }
}