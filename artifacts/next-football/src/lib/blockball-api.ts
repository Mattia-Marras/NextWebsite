const BASE = "/api/blockball";

async function get<T>(url: string): Promise<T> {
  const response = await fetch(`${BASE}${url}`);
  if (!response.ok) {
    throw new Error((await response.json().catch(() => null))?.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export type BBLeague = "ML" | "LL";
export const getBlockballLeague = (league: BBLeague) => get<any>(`/league/${league}`);
export const getBlockballRanked = () => get<any>("/ranked");
export const getBlockballPlayers = () => get<any[]>("/players");
export const getBlockballPlayer = (uuid: string) => get<any>(`/players/${encodeURIComponent(uuid)}`);
export const resolveBlockballPlayer = (name: string) =>
  get<{ uuid: string; name: string }>(`/players/resolve/${encodeURIComponent(name)}`);
