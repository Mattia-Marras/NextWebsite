import { useQuery } from "@tanstack/react-query";
import { useListRecentMatches, useListUpcomingMatches } from "@workspace/api-client-react";
import { ArrowRight, CalendarDays, History, Trophy } from "lucide-react";
import { Link, useParams } from "wouter";

import { MatchCard } from "@/components/match-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeagueTheme } from "@/lib/league-theme";
import { getNextFootballLeague, getNextFootballLeagueHistory, type HistoricalStatLine, type LeagueCode } from "@/lib/nextfb-api";

const LEAGUE_IDS: Record<string, number> = { main: 1, lower: 2 };

export function Home() {
  const { server = "football", league = "main" } = useParams<{ server: string; league: string }>();
  const theme = getLeagueTheme(server, league);
  const leagueId = server === "football" ? LEAGUE_IDS[league] : undefined;
  const leagueName = league === "lower" ? "Lower League" : "Main League";
  const leagueCode: LeagueCode = league === "lower" ? "LL" : "ML";

  const recent = useListRecentMatches({ server: server as any, league: league as any });
  const upcoming = useListUpcomingMatches({ server: server as any, league: league as any });
  const history = useQuery({
    queryKey: ["nextfb", "league-history", leagueCode],
    queryFn: () => getNextFootballLeagueHistory(leagueCode),
    enabled: server === "football",
  });

  const standings = useQuery({
    queryKey: ["nextfb", "league", leagueId],
    queryFn: () => getNextFootballLeague(leagueId!),
    enabled: Boolean(leagueId),
  });

  return (
    <div className="pb-16">
      <section className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.32em]" style={{ color: theme.hex }}>NEXT Football League</p>
              <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight md:text-5xl">{leagueName}</h1>
              <p className="mt-4 max-w-2xl text-muted-foreground">One clear overview for standings, upcoming fixtures and recent results.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/${server}/main`}><Button variant={league === "main" ? "default" : "outline"}>Main League</Button></Link>
              <Link href={`/${server}/lower`}><Button variant={league === "lower" ? "default" : "outline"}>Lower League</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto space-y-7 px-4 pt-7">
        <section className="surface-panel p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">League table</p>
              <h2 className="mt-1 font-display text-2xl font-bold uppercase">Standings</h2>
            </div>
            <Link href={`/${server}/${league}/standings`} className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: theme.hex }}>Full standings <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[56px_1fr_repeat(5,64px)] border-b border-border px-3 pb-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span>#</span><span>Team</span><span className="text-center">P</span><span className="text-center">W</span><span className="text-center">D</span><span className="text-center">GD</span><span className="text-center">Pts</span>
              </div>
              {standings.isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="my-2 h-14 w-full" />) : standings.data?.standings.slice(0, 6).map((row) => (
                <div key={row.teamName} className="grid grid-cols-[56px_1fr_repeat(5,64px)] items-center border-b border-border/60 px-3 py-4 last:border-0">
                  <span className="font-display text-lg font-bold" style={{ color: row.position <= 3 ? theme.hex : undefined }}>{row.position}</span>
                  <span className="font-display font-semibold uppercase tracking-wide">{row.teamName}</span>
                  <span className="text-center text-muted-foreground">{row.played}</span>
                  <span className="text-center text-muted-foreground">{row.won}</span>
                  <span className="text-center text-muted-foreground">{row.drawn}</span>
                  <span className="text-center text-muted-foreground">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
                  <span className="text-center font-bold" style={{ color: theme.hex }}>{row.points}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-panel p-5 md:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">League history</p><h2 className="mt-1 flex items-center gap-2 font-display text-2xl font-bold uppercase"><History className="h-5 w-5" /> Current & past seasons</h2></div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{leagueCode} kept separate</span>
          </div>
          {history.isLoading ? <Skeleton className="h-64 w-full" /> : history.data ? <div className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-2">
              <LeagueHistoryStats title="Current" subtitle="Live totals from player_stats" stats={history.data.current} accent={theme.hex} />
              <LeagueHistoryStats title="All-time league total" subtitle="Finalized past seasons + current live stats" stats={history.data.totalWithCurrent} accent={theme.hex} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold uppercase">Past seasons</h3>
              <p className="mt-1 text-sm text-muted-foreground">Only finalized seasons are shown here; CURRENT is always read directly from the live table.</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">{history.data.pastSeasons.length ? history.data.pastSeasons.map((season) => {
                const awards = history.data.awards.filter((a) => a.season === season.season);
                const rewards = history.data.rewards.filter((r) => r.season === season.season);
                const cards = history.data.cards.filter((c) => c.season === season.season);

                return <Link key={season.season} href={`/football/${league}/history/${season.season}`} className="group block rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04]">
                  <div className="flex items-center justify-between gap-3"><div><b className="font-display text-xl uppercase">Season {season.season}</b><p className="text-xs text-muted-foreground">{season.players} players · finalized</p></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-muted-foreground transition group-hover:text-foreground">Open season →</span></div>
                  <div className="mt-4"><MiniLeagueStats stats={season} /></div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-white/8 px-2.5 py-1">Awards {awards.reduce((n,a)=>n+a.amount,0)}</span><span className="rounded-full border border-white/8 px-2.5 py-1">Rewards {rewards.reduce((n,r)=>n+r.amount,0)}</span><span className="rounded-full border border-white/8 px-2.5 py-1">UT cards {cards.length}</span></div>
                </Link>;

              }) : <p className="text-sm text-muted-foreground">No finalized past seasons imported yet.</p>}</div>
            </div>
          </div> : <p className="text-sm text-muted-foreground">League history is not available.</p>}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <MatchSection title="Upcoming fixtures" icon={<CalendarDays className="h-5 w-5" />} href={`/${server}/${league}/fixtures`} loading={upcoming.isLoading} matches={upcoming.data?.slice(0, 3) ?? []} empty="No upcoming fixtures." compact />
          <MatchSection title="Recent results" icon={<Trophy className="h-5 w-5" />} href={`/${server}/${league}/results`} loading={recent.isLoading} matches={recent.data?.slice(0, 3) ?? []} empty="No recent results." />
        </div>
      </main>
    </div>
  );
}

function MiniLeagueStats({ stats }: { stats: HistoricalStatLine }) {
  const entries = [["MP",stats.matches],["G",stats.goals],["A",stats.assists],["P",stats.passes],["S",stats.saves],["W",stats.wins],["D",stats.draws],["L",stats.losses]] as const;
  return <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{entries.map(([label,value]) => <div key={label} className="rounded-xl border border-white/6 p-2 text-center"><p className="text-[10px] text-muted-foreground">{label}</p><b>{value}</b></div>)}</div>;
}

function LeagueHistoryStats({ title, subtitle, stats, accent }: { title: string; subtitle: string; stats: HistoricalStatLine; accent: string }) {
  return <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div><h3 className="font-display text-lg font-bold uppercase" style={{color:accent}}>{title}</h3><p className="text-xs text-muted-foreground">{subtitle}</p></div><div className="mt-4"><MiniLeagueStats stats={stats}/></div></div>;
}

function MatchSection({ title, icon, href, loading, matches, empty, compact = false }: { title: string; icon: React.ReactNode; href: string; loading: boolean; matches: any[]; empty: string; compact?: boolean }) {
  return (
    <section className="surface-panel p-5 md:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase">{icon}{title}</h2>
        <Link href={href} className="text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground">View all</Link>
      </div>
      <div className="space-y-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />) : matches.length ? matches.map((match) => <MatchCard key={match.id} match={match} variant={compact ? "compact" : undefined} />) : <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">{empty}</div>}
      </div>
    </section>
  );
}
