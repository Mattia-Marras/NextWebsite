export interface MojangPlayer {
  uuid: string;
  username: string;
}

interface MojangApiResponse {
  id: string;
  name: string;
}

const MOJANG_API =
  "https://api.mojang.com/users/profiles/minecraft";

const REQUEST_TIMEOUT_MS = 5000;

/**
 * Verifica che il nome Minecraft sia valido.
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
 * Converte
 * 069a79f444e94726a5befca90e38aaf5
 * ->
 * 069a79f4-44e9-4726-a5be-fca90e38aaf5
 */
export function formatUuid(
  compactUuid: string,
): string {
  return [
    compactUuid.substring(0, 8),
    compactUuid.substring(8, 12),
    compactUuid.substring(12, 16),
    compactUuid.substring(16, 20),
    compactUuid.substring(20),
  ].join("-");
}

/**
 * Risolve un username Minecraft tramite Mojang.
 *
 * Restituisce:
 * - uuid
 * - username corretto
 *
 * Restituisce null se il giocatore non esiste.
 */
export async function resolveMinecraftPlayer(
  rawUsername: string,
): Promise<MojangPlayer | null> {
  const username =
    normalizeMinecraftUsername(rawUsername);

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${MOJANG_API}/${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      },
    );

    if (
      response.status === 204 ||
      response.status === 404
    ) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Mojang API returned HTTP ${response.status}`,
      );
    }

    const json =
      (await response.json()) as MojangApiResponse;

    if (
      typeof json.id !== "string" ||
      typeof json.name !== "string"
    ) {
      throw new Error(
        "Invalid Mojang API response.",
      );
    }

    return {
      uuid: formatUuid(json.id.toLowerCase()),
      username: json.name,
    };
  } finally {
    clearTimeout(timeout);
  }
}