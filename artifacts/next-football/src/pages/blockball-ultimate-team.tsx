import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers3, Search, Users, WalletCards } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockballUltimateTeamCard } from "@/components/blockball-ultimate-team-card";
import { getGlobalBlockballUltimateTeamCards } from "@/lib/blockball-api";

const Metric = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => <div className="rounded-2xl border border-sky-400/15 bg-sky-400/[0.04] px-4 py-3"><div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">{icon}{label}</div><b className="mt-1 block text-2xl">{value}</b></div>;

export function BlockballUltimateTeam() {
  const [search,setSearch] = useState("");
  const [season,setSeason] = useState("ALL");
  const query = useQuery({queryKey:["blockball-ut-global"],queryFn:getGlobalBlockballUltimateTeamCards});
  const all = query.data?.data ?? [];
  const seasons = useMemo(()=>[...new Set(all.map(card=>card.seasonId))].sort().reverse(),[all]);
  const cards = useMemo(()=>{const value=search.trim().toLowerCase(); return all.filter(card=>(season==="ALL"||card.seasonId===season)&&(!value||[card.username,card.playerUuid,card.cardType,card.position,card.seasonId].filter(Boolean).some(field=>String(field).toLowerCase().includes(value))));},[all,search,season]);
  const copies=all.reduce((sum,card)=>sum+(card.totalCopies??0),0);
  const owned=all.filter(card=>(card.owners??0)>0).length;
  return <div className="container mx-auto px-4 py-10 md:py-14"><div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">NEXT BlockBall</p><h1 className="mt-2 font-display text-4xl font-black uppercase md:text-6xl">Ultimate Team</h1><p className="mt-3 max-w-2xl text-muted-foreground">Complete S1 and S2 card catalogue, with ownership read directly from the BlockBall database.</p></div><div className="grid grid-cols-3 gap-2"><Metric icon={<Layers3 className="h-4 w-4"/>} label="Cards" value={query.data?.total??0}/><Metric icon={<WalletCards className="h-4 w-4"/>} label="Copies" value={copies}/><Metric icon={<Users className="h-4 w-4"/>} label="Owned cards" value={owned}/></div></div>
    <div className="mb-7 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search player, UUID, type or position" className="pl-10"/></div><select value={season} onChange={e=>setSeason(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="ALL">All seasons</option>{seasons.map(item=><option key={item} value={item}>Season {item}</option>)}</select></div>
    {query.isLoading?<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-72 rounded-2xl"/>)}</div>:query.isError?<div className="rounded-2xl border border-destructive/30 p-8 text-destructive">Could not load the BlockBall Ultimate Team catalogue.</div>:cards.length?<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card=><BlockballUltimateTeamCard key={card.id} card={card} showOwnership/>)}</div>:<div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-muted-foreground">No UT cards match these filters.</div>}
  </div>;
}
