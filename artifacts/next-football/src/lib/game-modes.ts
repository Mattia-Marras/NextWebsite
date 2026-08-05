import { BarChart3, Search, Trophy, Users } from "lucide-react";

export type GameModeId = "football" | "blockball";

export interface GameModeSection {
  label: string;
  href: string;
  icon: typeof Trophy;
  available: boolean;
}

export interface GameModeDefinition {
  id: GameModeId;
  name: string;
  shortName: string;
  description: string;
  accent: string;
  accentSoft: string;
  available: boolean;
  landingHref: string;
  sections: GameModeSection[];
}

export const GAME_MODES: GameModeDefinition[] = [
  {
    id: "football",
    name: "NEXT Football",
    shortName: "Football",
    description: "Ranked, leagues, player profiles and complete statistics.",
    accent: "#39ff14",
    accentSoft: "rgba(57,255,20,.12)",
    available: true,
    landingHref: "/football/main",
    sections: [
      { label: "Ranked", href: "/football/leaderboards?tab=ranked", icon: BarChart3, available: true },
      { label: "League", href: "/football/main", icon: Trophy, available: true },
      { label: "Player search", href: "/football/players", icon: Search, available: true },
      { label: "Leaderboards", href: "/football/leaderboards", icon: Users, available: true },
    ],
  },
  {
    id: "blockball",
    name: "NEXT Blockball",
    shortName: "Blockball",
    description: "Leagues, matches and competitive statistics in a dedicated Blockball ecosystem.",
    accent: "#38bdf8",
    accentSoft: "rgba(56,189,248,.12)",
    available: true,
    landingHref: "/blockball/main",
    sections: [
      { label: "League", href: "/blockball/main", icon: Trophy, available: true },
      { label: "Ranked", href: "/blockball/ranked", icon: BarChart3, available: true },
      { label: "Player search", href: "/blockball/players", icon: Search, available: true },
      { label: "Leaderboards", href: "/blockball/leaderboards", icon: Users, available: true },
    ],
  },
];

export function getGameModeFromPath(path: string): GameModeDefinition {
  const firstSegment = path.split("/").filter(Boolean)[0];
  return GAME_MODES.find((mode) => mode.id === firstSegment) ?? GAME_MODES[0];
}
