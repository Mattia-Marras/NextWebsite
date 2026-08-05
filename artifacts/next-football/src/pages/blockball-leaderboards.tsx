import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Coins, Crown, Sparkles, Trophy } from "lucide-react";
import { getBlockballPlayers } from "@/lib/blockball-api";

const N = (value: unknown) => new Intl.NumberFormat("en-US").format(Number(value) || 0);

export function BlockballLeaderboards() {
  const query = useQuery({ queryKey: ["bb-players"], queryFn: getBlockballPlayers });
  return (
    <div className="container mx-auto space-y-8 px-4 py-10">
      <section className="relative overflow-hidden rounded-[28px] border border-sky-400/20 bg-gradient-to-br from-sky-400/12 via-white/[0.035] to-transparent p-7 md:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.32em] text-sky-400">NEXT BlockBall Progression</p>
        <h1 className="relative mt-3 font-display text-4xl font-bold uppercase md:text-6xl">Player Leaderboard</h1>
        <p className="relative mt-3 max-w-2xl text-muted-foreground">The highest-level BlockBall accounts, ordered by level and accumulated experience.</p>
      </section>

      <section className="surface-panel overflow-hidden">
        <div className="grid grid-cols-[70px_1fr_120px_150px_140px] gap-3 border-b border-white/8 bg-white/[0.025] px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Rank</span><span>Player</span><span>Level</span><span>Experience</span><span>Coins</span>
        </div>
        {query.isLoading ? <p className="p-6">Loading player leaderboard...</p> : query.isError ? <p className="p-6 text-destructive">Player progression data is currently unavailable.</p> : query.data?.map((player: any, index: number) => (
          <div key={player.uuid} className="grid grid-cols-[70px_1fr_120px_150px_140px] items-center gap-3 border-b border-white/6 px-6 py-4 transition hover:bg-white/[0.035]">
            <div className="flex items-center gap-2"><Trophy className={`h-4 w-4 ${index < 3 ? "text-sky-400" : "text-muted-foreground"}`} /><b>{index + 1}</b></div>
            <Link href={`/blockball/profile/${player.uuid}`} className="font-semibold hover:text-sky-400">{player.name}</Link>
            <span className="flex items-center gap-2"><Crown className="h-4 w-4 text-sky-400" />{N(player.level)}</span>
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-muted-foreground" />{N(player.xp)} XP</span>
            <span className="flex items-center gap-2"><Coins className="h-4 w-4 text-muted-foreground" />{N(player.coins)}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
