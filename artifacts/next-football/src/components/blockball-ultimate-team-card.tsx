import { RenderedUltimateTeamCard } from "@/components/ultimate-team-rendered-card";
import type { BlockballUltimateTeamCard as BlockballCard } from "@/lib/blockball-api";

export function BlockballUltimateTeamCard({
  card,
  showOwnership = false,
}: {
  card: BlockballCard;
  showOwnership?: boolean;
}) {
  const stats = [
    ["PAC", card.pace],
    ["SHO", card.shooting],
    ["PAS", card.passing],
    ["DRI", card.dribbling],
    ["DEF", card.defending],
    ["PHY", card.physical],
  ] as const;

  return (
    <RenderedUltimateTeamCard
      href={`/blockball/profile/${card.playerUuid}`}
      card={card}
      stats={stats}
      competition="NEXT BLOCKBALL"
      accent="#38bdf8"
      showOwnership={showOwnership}
    />
  );
}
