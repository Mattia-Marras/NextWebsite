import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Activity,
  BarChart3,
  Crosshair,
  Goal,
  Medal,
  Shield,
  Swords,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { getRankTheme } from "@/lib/rank-colors";
import {
  RANKED_STATS,
  getRankedLeaderboard,
  type RankedLeaderboardEntry,
  type RankedStat,
} from "@/lib/nextfb-api";

const ACCENT = "#39ff14";
const NUMBER = new Intl.NumberFormat("en-US");

type RankedMetric = "MMR" | "WIN_RATE" | RankedStat;

type RankedEntryWithUsername = RankedLeaderboardEntry & {
  username?: string | null;
};

function n(value: number | null | undefined) {
  return NUMBER.format(value ?? 0);
}

function percentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function label(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function playerName(player: RankedEntryWithUsername) {
  return player.username?.trim() || "Unknown player";
}

function games(player: RankedEntryWithUsername) {
  return player.stats?.MATCHES_PLAYED ?? player.wins + player.losses;
}

function winRate(player: RankedEntryWithUsername) {
  const total = games(player);
  return total > 0 ? (player.wins / total) * 100 : 0;
}

function metricValue(player: RankedEntryWithUsername, metric: RankedMetric) {
  if (metric === "MMR") return player.mmr;
  if (metric === "WIN_RATE") return winRate(player);
  return player.stats?.[metric] ?? 0;
}

function metricDisplay(player: RankedEntryWithUsername, metric: RankedMetric) {
  const value = metricValue(player, metric);
  return metric === "WIN_RATE" ? percentage(value) : n(value);
}

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export function FootballRanked() {
  const [metric, setMetric] = useState<RankedMetric>("MMR");
  const query = useQuery({
    queryKey: ["nextfootball-ranked-page"],
    queryFn: () => getRankedLeaderboard({ limit: 100, offset: 0 }),
  });

  const players = (query.data?.data ?? []) as RankedEntryWithUsername[];

  const sorted = useMemo(
    () =>
      [...players].sort(
        (a, b) =>
          metricValue(b, metric) - metricValue(a, metric) || b.mmr - a.mmr,
      ),
    [players, metric],
  );

  const totals = useMemo(() => {
    const matches = players.reduce((sum, player) => sum + games(player), 0) / 2;
    const goals = players.reduce((sum, player) => sum + (player.stats?.GOALS ?? 0), 0);
    const assists = players.reduce((sum, player) => sum + (player.stats?.ASSISTS ?? 0), 0);
    const saves = players.reduce((sum, player) => sum + (player.stats?.SAVES ?? 0), 0);
    const shots = players.reduce((sum, player) => sum + (player.stats?.SHOTS_ON_NET ?? 0), 0);
    const passes = players.reduce((sum, player) => sum + (player.stats?.PASSES ?? 0), 0);

    return {
      matches: Math.floor(matches),
      goals,
      assists,
      saves,
      shots,
      passes,
    };
  }, [players]);

  const rankDistribution = useMemo(() => {
    const counts = new Map<string, { displayName: string; count: number }>();
    for (const player of players) {
      const key = player.rank.name;
      const current = counts.get(key);
      counts.set(key, {
        displayName: player.rank.displayName,
        count: (current?.count ?? 0) + 1,
      });
    }
    return [...counts.entries()]
      .map(([rank, value]) => ({ rank, ...value }))
      .sort((a, b) => b.count - a.count);
  }, [players]);

  const chartData = sorted.slice(0, 10).map((player) => ({
    name: playerName(player),
    value: metricValue(player, metric),
  }));

  const top = players[0];
  const topGoals = [...players].sort((a, b) => (b.stats?.GOALS ?? 0) - (a.stats?.GOALS ?? 0))[0];
  const topAssists = [...players].sort((a, b) => (b.stats?.ASSISTS ?? 0) - (a.stats?.ASSISTS ?? 0))[0];
  const topSaves = [...players].sort((a, b) => (b.stats?.SAVES ?? 0) - (a.stats?.SAVES ?? 0))[0];
  const eligibleWinRate = players.filter((player) => games(player) >= 5);
  const topWinRate = [...eligibleWinRate].sort((a, b) => winRate(b) - winRate(a))[0];

  if (query.isLoading) {
    return <main className="container mx-auto px-4 py-12 text-muted-foreground">Loading Ranked...</main>;
  }

  if (query.isError) {
    return <main className="container mx-auto px-4 py-12 text-destructive">Ranked statistics are currently unavailable.</main>;
  }

  const metrics: RankedMetric[] = ["MMR", "WIN_RATE", ...RANKED_STATS];

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden border-b border-border bg-background py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#39ff14]/10 blur-[130px]" />
        </div>
        <div className="container relative mx-auto px-4">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.32em] text-[#39ff14]">NextFootball Competitive</p>
          <div className="mt-4 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-5xl font-bold uppercase tracking-tight md:text-7xl">Ranked</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Competitive standings, rank distribution, performance leaders and detailed Ranked statistics in one place.
              </p>
            </div>
            {top ? (
              <Link href={`/football/profile/${encodeURIComponent(top.uuid)}`} className="rounded-2xl border border-[#39ff14]/25 bg-[#39ff14]/[0.055] px-5 py-4 transition hover:bg-[#39ff14]/10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ranked leader</p>
                <p className="mt-1 font-display text-2xl font-bold">{playerName(top)}</p>
                <p className="mt-1 text-sm text-[#39ff14]">{top.rank.displayWithDivision} · {n(top.mmr)} MMR</p>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <main className="container mx-auto space-y-7 px-4 pt-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [Users, "Ranked players", query.data?.total ?? players.length],
            [Swords, "Recorded matches", totals.matches],
            [Goal, "Ranked goals", totals.goals],
            [Target, "Goal conversion", totals.shots ? percentage(rate(totals.goals, totals.shots) * 100) : "—"],
          ].map(([Icon, title, value]: any) => (
            <div key={title} className="surface-panel p-5">
              <Icon className="h-5 w-5 text-[#39ff14]" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{title}</p>
              <p className="mt-1 font-display text-3xl font-bold">{typeof value === "number" ? n(value) : value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <LeaderCard icon={<Trophy className="h-5 w-5" />} title="Highest MMR" player={top} value={top ? `${n(top.mmr)} MMR` : "—"} />
          <LeaderCard icon={<Goal className="h-5 w-5" />} title="Top scorer" player={topGoals} value={topGoals ? `${n(topGoals.stats.GOALS)} goals` : "—"} />
          <LeaderCard icon={<Crosshair className="h-5 w-5" />} title="Top assister" player={topAssists} value={topAssists ? `${n(topAssists.stats.ASSISTS)} assists` : "—"} />
          <LeaderCard icon={<Shield className="h-5 w-5" />} title="Top saver" player={topSaves} value={topSaves ? `${n(topSaves.stats.SAVES)} saves` : "—"} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <div className="surface-panel p-5 md:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><BarChart3 className="h-5 w-5 text-[#39ff14]" /> Top 10 comparison</h2>
                <p className="mt-1 text-sm text-muted-foreground">Switch metric to compare the strongest Ranked performances.</p>
              </div>
              <select value={metric} onChange={(event) => setMetric(event.target.value as RankedMetric)} className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[#39ff14]">
                {metrics.map((item) => <option key={item} value={item}>{label(item)}</option>)}
              </select>
            </div>
            <div className="mt-6 h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.12} />
                  <XAxis dataKey="name" angle={-24} textAnchor="end" height={72} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#0b1017", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} formatter={(value: number) => metric === "WIN_RATE" ? percentage(value) : n(value)} />
                  <Bar dataKey="value" fill={ACCENT} radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-panel p-5 md:p-7">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><Medal className="h-5 w-5 text-[#39ff14]" /> Rank distribution</h2>
            <p className="mt-1 text-sm text-muted-foreground">Current competitive population by rank.</p>
            <div className="mt-6 space-y-3">
              {rankDistribution.length ? rankDistribution.map((item) => {
                const theme = getRankTheme(item.rank as RankedLeaderboardEntry["rank"]["name"]);
                const share = players.length ? (item.count / players.length) * 100 : 0;
                return (
                  <div key={item.rank}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold" style={{ color: theme.text }}>{item.displayName}</span>
                      <span className="text-muted-foreground">{item.count} · {percentage(share)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.055]">
                      <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: theme.text }} />
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground">No Ranked players recorded.</p>}
            </div>
            {topWinRate ? (
              <Link href={`/football/profile/${encodeURIComponent(topWinRate.uuid)}`} className="mt-7 block rounded-2xl border border-white/8 bg-white/[0.025] p-4 hover:bg-white/[0.04]">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Best win rate · min. 5 matches</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <b className="font-display text-xl">{playerName(topWinRate)}</b>
                  <b className="text-[#39ff14]">{percentage(winRate(topWinRate))}</b>
                </div>
              </Link>
            ) : null}
          </div>
        </section>

        <section className="surface-panel overflow-hidden">
          <div className="border-b border-border p-5 md:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><Activity className="h-5 w-5 text-[#39ff14]" /> Competitive standings</h2>
                <p className="mt-1 text-sm text-muted-foreground">Full Ranked record, ordered by {label(metric)}.</p>
              </div>
              <Badge variant="outline">{players.length} loaded players</Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[1120px]">
              <div className="grid grid-cols-[64px_minmax(190px,1fr)_160px_95px_90px_90px_90px_90px_100px_110px] gap-3 border-b border-border bg-white/[0.02] px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <span>#</span><span>Player</span><span>Rank</span><span>MMR</span><span>MP</span><span>W</span><span>L</span><span>G</span><span>A</span><span>{label(metric)}</span>
              </div>
              {sorted.map((player, index) => {
                const theme = getRankTheme(player.rank.name);
                return (
                  <Link key={player.uuid} href={`/football/profile/${encodeURIComponent(player.uuid)}`} className="grid grid-cols-[64px_minmax(190px,1fr)_160px_95px_90px_90px_90px_90px_100px_110px] items-center gap-3 border-b border-border/60 px-5 py-4 transition hover:bg-[#39ff14]/[0.035]">
                    <b className={index < 3 ? "text-[#39ff14]" : "text-muted-foreground"}>{index + 1}</b>
                    <span className="truncate font-semibold">{playerName(player)}</span>
                    <span className="w-fit rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ color: theme.text, borderColor: theme.border, backgroundColor: theme.background }}>{player.rank.displayWithDivision}</span>
                    <b>{n(player.mmr)}</b>
                    <span>{n(games(player))}</span>
                    <span>{n(player.wins)}</span>
                    <span>{n(player.losses)}</span>
                    <span>{n(player.stats.GOALS)}</span>
                    <span>{n(player.stats.ASSISTS)}</span>
                    <b className="text-[#39ff14]">{metricDisplay(player, metric)}</b>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Passes", totals.passes],
            ["Shots on net", totals.shots],
            ["Assists", totals.assists],
            ["Saves", totals.saves],
          ].map(([title, value]) => (
            <div key={String(title)} className="rounded-2xl border border-border bg-card/45 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
              <p className="mt-2 font-display text-3xl font-bold">{n(Number(value))}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

function LeaderCard({
  icon,
  title,
  player,
  value,
}: {
  icon: ReactNode;
  title: string;
  player: RankedEntryWithUsername | undefined;
  value: string;
}) {
  if (!player) {
    return (
      <div className="surface-panel p-5">
        <div className="text-[#39ff14]">{icon}</div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
        <p className="mt-2 font-display text-xl font-bold">No data</p>
      </div>
    );
  }

  return (
    <Link href={`/football/profile/${encodeURIComponent(player.uuid)}`} className="surface-panel block p-5 transition hover:border-[#39ff14]/30 hover:bg-[#39ff14]/[0.035]">
      <div className="text-[#39ff14]">{icon}</div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      <p className="mt-2 truncate font-display text-xl font-bold">{playerName(player)}</p>
      <p className="mt-1 text-sm text-[#39ff14]">{value}</p>
    </Link>
  );
}
