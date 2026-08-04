import { useQuery } from "@tanstack/react-query";
import { useListRecentMatches, useListUpcomingMatches } from "@workspace/api-client-react";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";
import { Link, useParams } from "wouter";

import { MatchCard } from "@/components/match-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeagueTheme } from "@/lib/league-theme";
import { getNextFootballLeague } from "@/lib/nextfb-api";

const LEAGUE_IDS: Record<string, number> = { main: 1, lower: 2 };

export function Home() {
  const { server = "football", league = "main" } = useParams<{ server: string; league: string }>();
  const theme = getLeagueTheme(server, league);
  const leagueId = server === "football" ? LEAGUE_IDS[league] : undefined;
  const leagueName = league === "lower" ? "Lower League" : "Main League";

  const recent = useListRecentMatches({ server: server as any, league: league as any });
  const upcoming = useListUpcomingMatches({ server: server as any, league: league as any });
  const standings = useQuery({
    queryKey: ["nextfb", "league", leagueId],
    queryFn: () => getNextFootballLeague(leagueId!),
    enabled: Boolean(leagueId),
  });

  return (
    <div className="pb-16">
      <section className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.32em]" style={{ color: theme.hex }}>NEXT Football League</p>
              <h1 className="mt-3 font-display text-5xl font-bold uppercase tracking-tight md:text-7xl">{leagueName}</h1>
              <p className="mt-4 max-w-2xl text-muted-foreground">One clear overview for standings, upcoming fixtures and recent results.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/${server}/main`}><Button variant={league === "main" ? "default" : "outline"}>Main League</Button></Link>
              <Link href={`/${server}/lower`}><Button variant={league === "lower" ? "default" : "outline"}>Lower League</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto space-y-10 px-4 pt-10">
        <section className="rounded-2xl border border-border bg-card/70 p-5 md:p-7">
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

        <div className="grid gap-8 lg:grid-cols-2">
          <MatchSection title="Upcoming fixtures" icon={<CalendarDays className="h-5 w-5" />} href={`/${server}/${league}/fixtures`} loading={upcoming.isLoading} matches={upcoming.data?.slice(0, 3) ?? []} empty="No upcoming fixtures." compact />
          <MatchSection title="Recent results" icon={<Trophy className="h-5 w-5" />} href={`/${server}/${league}/results`} loading={recent.isLoading} matches={recent.data?.slice(0, 3) ?? []} empty="No recent results." />
        </div>
      </main>
    </div>
  );
}

function MatchSection({ title, icon, href, loading, matches, empty, compact = false }: { title: string; icon: React.ReactNode; href: string; loading: boolean; matches: any[]; empty: string; compact?: boolean }) {
  return (
    <section className="rounded-2xl border border-border bg-card/70 p-5 md:p-7">
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
