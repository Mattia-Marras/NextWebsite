const BASE = "/api/blockball";

async function get<T>(url: string): Promise<T> {
  const response = await fetch(`${BASE}${url}`);
  if (!response.ok) {
    throw new Error((await response.json().catch(() => null))?.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export type BBLeague = "ML" | "LL";
export const getBlockballLeague = (league: BBLeague, season?: string) => get<any>(`/league/${league}${season ? `?season=${encodeURIComponent(season)}` : ""}`);
export const getBlockballRanked = () => get<any>("/ranked");
export const getBlockballPlayers = () => get<any[]>("/players");
export const getBlockballPlayer = (uuid: string) => get<any>(`/players/${encodeURIComponent(uuid)}`);
export const resolveBlockballPlayer = (name: string) =>
  get<{ uuid: string; name: string }>(`/players/resolve/${encodeURIComponent(name)}`);

export interface BlockballUltimateTeamCard {
  id: number; playerUuid: string; username: string | null; seasonId: string;
  cardType: string; position: string; statsProfile: string; overall: number;
  pace: number; shooting: number; passing: number; dribbling: number;
  defending: number; physical: number; totalCopies?: number; owners?: number;
  quantity?: number; firstObtainedAt?: string | null;
}

export interface BlockballUltimateTeamResponse {
  data: BlockballUltimateTeamCard[];
  total: number;
}

export const getGlobalBlockballUltimateTeamCards = () =>
  get<BlockballUltimateTeamResponse>("/ultimate-team/cards");
export const getBlockballUltimateTeamCollection = (uuid: string) =>
  get<BlockballUltimateTeamResponse>(`/ultimate-team/players/${encodeURIComponent(uuid)}`);
