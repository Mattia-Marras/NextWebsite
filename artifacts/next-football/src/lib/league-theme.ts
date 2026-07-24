export type ServerKey = "football" | "blockball";
export type LeagueKey = "main" | "lower";

export interface LeagueTheme {
  hsl: string;
  hex: string;
  name: string;
}

const themes: Record<string, LeagueTheme> = {
  "football/main":   { hsl: "90 100% 45%",  hex: "#39ff14", name: "Football — Main League" },
  "football/lower":  { hsl: "25 100% 52%",  hex: "#ff6b00", name: "Football — Lower League" },
  "blockball/main":  { hsl: "200 100% 50%", hex: "#00b4ff", name: "Blockball — Main League" },
  "blockball/lower": { hsl: "0 90% 55%",    hex: "#ff2222", name: "Blockball — Lower League" },
};

export function getLeagueTheme(server: string, league: string): LeagueTheme {
  return themes[`${server}/${league}`] ?? themes["football/main"]!;
}
