import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import type { BlockballUltimateTeamCard as Card } from "@/lib/blockball-api";

const pretty = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const shortUuid = (uuid: string) => uuid.length > 13 ? `${uuid.slice(0, 8)}…` : uuid;

export function BlockballUltimateTeamCard({ card, showOwnership = false }: { card: Card; showOwnership?: boolean }) {
  const stats = [["PAC",card.pace],["SHO",card.shooting],["PAS",card.passing],
    ["DRI",card.dribbling],["DEF",card.defending],["PHY",card.physical]] as const;
  return <Link href={`/blockball/profile/${card.playerUuid}`} className="group relative overflow-hidden rounded-2xl border border-sky-400/15 bg-gradient-to-b from-sky-400/[0.07] to-white/[0.02] p-4 transition hover:-translate-y-0.5 hover:border-sky-400/45">
    <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl group-hover:bg-sky-400/20" />
    <div className="relative flex items-start justify-between gap-4"><div className="min-w-0"><div className="mb-2 flex flex-wrap gap-1.5"><Badge variant="outline" className="border-sky-400/30 bg-sky-400/10 text-sky-300">{card.position}</Badge><Badge variant="secondary">{pretty(card.cardType)}</Badge></div><h3 className="truncate font-display text-lg font-bold uppercase tracking-wide">{card.username?.trim() || shortUuid(card.playerUuid)}</h3><p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Season {card.seasonId}</p></div><div className="text-right"><div className="font-display text-4xl font-black leading-none text-sky-400">{card.overall}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">OVR</div></div></div>
    <div className="relative mt-5 grid grid-cols-3 gap-2">{stats.map(([label,value])=><div key={label} className="rounded-lg border border-white/7 bg-black/15 px-2 py-2 text-center"><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-0.5 font-display text-base font-bold">{value}</div></div>)}</div>
    {showOwnership && <div className="relative mt-4 flex items-center justify-between border-t border-white/7 pt-3 text-xs text-muted-foreground">{card.quantity !== undefined ? <span>Owned <b className="text-foreground">×{card.quantity}</b></span> : <><span>Owners <b className="text-foreground">{card.owners ?? 0}</b></span><span>Copies <b className="text-foreground">{card.totalCopies ?? 0}</b></span></>}</div>}
  </Link>;
}
