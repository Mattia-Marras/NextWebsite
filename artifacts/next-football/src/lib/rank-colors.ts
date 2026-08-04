import type { RankName } from "@/lib/nextfb-api";

export interface RankTheme {
  text: string;
  border: string;
  background: string;
  glow: string;
}

const RANK_THEMES: Record<RankName, RankTheme> = {
  IRON: {
    text: "#cbd5e1",
    border: "rgba(203, 213, 225, 0.38)",
    background: "rgba(203, 213, 225, 0.09)",
    glow: "rgba(203, 213, 225, 0.16)",
  },
  BRONZE: {
    text: "#f59e0b",
    border: "rgba(245, 158, 11, 0.45)",
    background: "rgba(245, 158, 11, 0.12)",
    glow: "rgba(245, 158, 11, 0.22)",
  },
  GOLD: {
    text: "#facc15",
    border: "rgba(250, 204, 21, 0.48)",
    background: "rgba(250, 204, 21, 0.12)",
    glow: "rgba(250, 204, 21, 0.24)",
  },
  EMERALD: {
    text: "#34d399",
    border: "rgba(52, 211, 153, 0.48)",
    background: "rgba(52, 211, 153, 0.12)",
    glow: "rgba(52, 211, 153, 0.22)",
  },
  PLATINUM: {
    text: "#67e8f9",
    border: "rgba(103, 232, 249, 0.48)",
    background: "rgba(103, 232, 249, 0.11)",
    glow: "rgba(103, 232, 249, 0.22)",
  },
  RUBY: {
    text: "#fb7185",
    border: "rgba(251, 113, 133, 0.5)",
    background: "rgba(251, 113, 133, 0.12)",
    glow: "rgba(251, 113, 133, 0.23)",
  },
  DIAMOND: {
    text: "#60a5fa",
    border: "rgba(96, 165, 250, 0.5)",
    background: "rgba(96, 165, 250, 0.12)",
    glow: "rgba(96, 165, 250, 0.24)",
  },
  LEGEND: {
    text: "#c084fc",
    border: "rgba(192, 132, 252, 0.5)",
    background: "rgba(192, 132, 252, 0.12)",
    glow: "rgba(192, 132, 252, 0.25)",
  },
  MYTHIC: {
    text: "#f472b6",
    border: "rgba(244, 114, 182, 0.52)",
    background: "rgba(244, 114, 182, 0.13)",
    glow: "rgba(244, 114, 182, 0.26)",
  },
};

export function getRankTheme(rank: RankName): RankTheme {
  return RANK_THEMES[rank];
}
