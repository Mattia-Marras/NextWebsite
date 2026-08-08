import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Activity, BarChart3, Medal, ShieldCheck, Swords, Trophy } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getBlockballRanked } from "@/lib/blockball-api";

const N = (value: unknown) => new Intl.NumberFormat("en-US").format(Number(value) || 0);
const P = (value: unknown) => `${(Number(value) || 0).toFixed(1)}%`;
const pretty = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function BlockballRanked() {
  const query = useQuery({ queryKey: ["blockball-ranked"], queryFn: getBlockballRanked });
  const [stat, setStat] = useState("MMR");
  const data = query.data;

  const sorted = useMemo(() => {
    if (!data) return [];
    if (stat === "MMR") return data.leaderboard;
    if (stat === "WIN_RATE") return [...data.leaderboard].sort((a: any, b: any) => b.winRate - a.winRate || b.games - a.games);
    return [...data.leaderboard].sort((a: any, b: any) => (b.stats?.[stat] || 0) - (a.stats?.[stat] || 0) || b.mmr - a.mmr);
  }, [data, stat]);

  const chartData = sorted.slice(0, 10).map((player: any) => ({
    name: player.name,
    value: stat === "MMR" ? player.mmr : stat === "WIN_RATE" ? player.winRate : player.stats?.[stat] || 0,
  }));

  if (query.isLoading) return <div className="container mx-auto px-4 py-12">Loading ranked data...</div>;
  if (query.isError) return <div className="container mx-auto px-4 py-12 text-destructive">Ranked data is currently unavailable.</div>;

  const totalPlayers = data.leaderboard.length;
  const totalGames = data.leaderboard.reduce((sum: number, player: any) => sum + player.games, 0) / 2;
  const top = data.leaderboard[0];
  const filters = ["MMR", ...data.statNames.filter((item: string) => item !== "WIN_RATE")];

  return (
    <div className="container mx-auto space-y-8 px-4 py-10">
      <section className="relative overflow-hidden rounded-[28px] border border-sky-400/20 bg-gradient-to-br from-sky-400/12 via-white/[0.035] to-transparent p-7 md:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.32em] text-sky-400">NEXT BlockBall Competitive</p>
        <div className="relative mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold uppercase md:text-6xl">Ranked Arena</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Live MMR standings, complete competitive statistics, win rates and rank progression across BlockBall Ranked.</p>
          </div>
          {top && (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current leader</p>
              <Link href={`/blockball/profile/${top.uuid}`} className="mt-1 block text-xl font-bold hover:text-sky-400">{top.name}</Link>
              <p className="text-sm text-sky-400">{top.rank.displayName} · {N(top.mmr)} MMR</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [Trophy, "Ranked players", totalPlayers],
          [Swords, "Recorded matches", Math.floor(totalGames)],
          [Medal, "Highest MMR", top?.mmr || 0],
          [ShieldCheck, "Top rank", top?.rank.displayName || "—"],
        ].map(([Icon, label, value]: any) => (
          <div key={label} className="surface-panel p-5">
            <Icon className="h-5 w-5 text-sky-400" />
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold">{typeof value === "number" ? N(value) : value}</p>
          </div>
        ))}
      </div>

      <section className="surface-panel p-5 md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><BarChart3 className="text-sky-400" /> Top 10 overview</h2>
            <p className="mt-1 text-sm text-muted-foreground">Compare the leading players across every tracked competitive statistic.</p>
          </div>
          <select value={stat} onChange={(event) => setStat(event.target.value)} className="rounded-xl border border-white/10 bg-[#0b1017] px-4 py-2.5 text-sm outline-none focus:border-sky-400">
            {filters.map((item: string) => <option key={item} value={item}>{pretty(item)}</option>)}
          </select>
        </div>
        <div className="mt-6 h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.12} />
              <XAxis dataKey="name" angle={-25} textAnchor="end" height={68} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#0b1017", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12 }} formatter={(value: any) => stat === "WIN_RATE" ? P(value) : N(value)} />
              <Bar dataKey="value" fill="currentColor" className="text-sky-400" radius={[7, 7, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="surface-panel overflow-hidden">
        <div className="border-b border-white/8 p-5 md:p-7">
          <h2 className="font-display text-2xl font-bold uppercase">Ranked leaderboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sorted by {pretty(stat)}.</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[70px_1fr_150px_110px_100px_100px_110px] gap-3 border-b border-white/8 bg-white/[0.025] px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>#</span><span>Player</span><span>Rank</span><span>MMR</span><span>Wins</span><span>Losses</span><span>{pretty(stat)}</span>
            </div>
            {sorted.map((player: any, index: number) => {
              const value = stat === "MMR" ? player.mmr : stat === "WIN_RATE" ? P(player.winRate) : N(player.stats?.[stat] || 0);
              return (
                <div key={player.uuid} className="grid grid-cols-[70px_1fr_150px_110px_100px_100px_110px] gap-3 border-b border-white/6 px-6 py-4 transition hover:bg-white/[0.035]">
                  <b className={index < 3 ? "text-sky-400" : ""}>{index + 1}</b>
                  <Link href={`/blockball/profile/${player.uuid}`} className="font-semibold hover:text-sky-400">{player.name}</Link>
                  <span>{player.rank.displayName}</span><b>{N(player.mmr)}</b><span>{N(player.wins)}</span><span>{N(player.losses)}</span><b>{value}</b>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
