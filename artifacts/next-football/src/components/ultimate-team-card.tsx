import { RenderedUltimateTeamCard } from "@/components/ultimate-team-rendered-card";
import type { UltimateTeamCard as UltimateTeamCardData } from "@/lib/nextfb-api";

export function UltimateTeamCard({
  card,
  showOwnership = false,
}: {
  card: UltimateTeamCardData;
  showOwnership?: boolean;
}) {
  const goalkeeper = card.position.trim().toUpperCase() === "GK";
  const stats = goalkeeper
    ? [
        ["REF", card.reflexes],
        ["PRE", card.predicting],
        ["STP", card.shotStopping],
        ["POS", card.positioning],
        ["PAS", card.passing],
        ["COM", card.composure],
      ] as const
    : [
        ["POS", card.positioning],
        ["SHO", card.shooting],
        ["PAS", card.passing],
        ["DRI", card.dribbling],
        ["DEF", card.defending],
        ["CON", card.ballControl],
      ] as const;

  return (
    <RenderedUltimateTeamCard
      href={`/football/profile/${card.playerUuid}`}
      card={card}
      stats={stats}
      competition={card.leagueName === "GLOBAL" ? "NEXTFOOTBALL" : card.leagueName}
      accent="#39ff14"
      showOwnership={showOwnership}
    />
  );
}
