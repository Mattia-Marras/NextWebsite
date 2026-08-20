import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers3, Search, Users, WalletCards } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UltimateTeamCard } from "@/components/ultimate-team-card";
import { getGlobalUltimateTeamCards } from "@/lib/nextfb-api";

export function UltimateTeam() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["nextfootball-ut-global"],
    queryFn: getGlobalUltimateTeamCards,
  });

  const cards = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return query.data?.data ?? [];
    return (query.data?.data ?? []).filter((card) =>
      [card.username, card.playerUuid, card.cardType, card.position, card.leagueName, card.seasonId]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [query.data, search]);

  const totalCopies = (query.data?.data ?? []).reduce((sum, card) => sum + (card.totalCopies ?? 0), 0);
  const owners = new Set((query.data?.data ?? []).flatMap((card) => (card.owners ?? 0) > 0 ? [card.id] : [])).size;

  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[#39ff14]">
            <WalletCards className="h-5 w-5" />
            <span className="font-display text-xs font-bold uppercase tracking-[0.28em]">NextFootball Ultimate Team</span>
          </div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tight md:text-6xl">Global Cards</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Complete NextFootball UT catalogue. Ownership comes directly from the live NextFootball database.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Metric icon={<Layers3 className="h-4 w-4" />} label="Cards" value={query.data?.total ?? 0} />
          <Metric icon={<WalletCards className="h-4 w-4" />} label="Copies" value={totalCopies} />
          <Metric icon={<Users className="h-4 w-4" />} label="Owned cards" value={owners} />
        </div>
      </div>

      <div className="mb-7 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search player, type, position, league or season..."
            className="pl-10"
          />
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-[315px] rounded-2xl" />)}
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Could not load the NextFootball Ultimate Team catalogue.
        </div>
      ) : cards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {cards.map((card) => <UltimateTeamCard key={card.id} card={card} showOwnership />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-10 text-center text-muted-foreground">
          No UT cards match this search.
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="min-w-24 rounded-xl border border-white/8 bg-white/[0.035] px-4 py-3">
      <div className="flex items-center gap-1.5 text-[#39ff14]">{icon}<span className="text-[10px] font-bold uppercase tracking-wider">{label}</span></div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
