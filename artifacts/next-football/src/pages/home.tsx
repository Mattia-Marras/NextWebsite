import { useListRecentMatches, useListUpcomingMatches, useGetStatsSummary } from "@workspace/api-client-react";
import { MatchCard } from "@/components/match-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "wouter";
import logoPath from "@assets/NEXTLogo2_2_1782769726637.png";
import { ArrowRight, Trophy, Activity, CalendarDays, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLeagueTheme } from "@/lib/league-theme";

export function Home() {
  const { server = "football", league = "main" } = useParams<{ server: string; league: string }>();

  const serverName = server === "blockball" ? "Blockball" : "NEXT Football";
  const leagueName = league === "lower" ? "Lower League" : "Main League";
  const theme = getLeagueTheme(server, league);

  const { data: recentMatches, isLoading: isLoadingRecent } = useListRecentMatches({ server: server as any, league: league as any });
  const { data: upcomingMatches, isLoading: isLoadingUpcoming } = useListUpcomingMatches({ server: server as any, league: league as any });
  const { data: stats, isLoading: isLoadingStats } = useGetStatsSummary({ server: server as any, league: league as any });

  const topMatches = recentMatches?.slice(0, 4) || [];
  const nextMatches = upcomingMatches?.slice(0, 4) || [];

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-border">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" style={{ backgroundColor: `hsl(${theme.hsl} / 0.12)` }} />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <Badge variant="outline" className="mb-6 px-3 py-1 font-display tracking-widest uppercase" style={{ color: theme.hex, borderColor: `${theme.hex}55`, backgroundColor: `${theme.hex}11` }}>
                Official League Platform
              </Badge>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold uppercase tracking-tighter leading-none mb-6">
                {serverName}<br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.hex}, #fff, ${theme.hex})` }}>
                  {leagueName}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto md:mx-0 font-sans mb-8">
                The underground fast-moving football league. High stakes, electric energy, and raw talent. Follow the action live.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Link href={`/${server}/${league}/results`} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-12 px-8 font-display uppercase tracking-widest text-black shadow transition-colors" style={{ backgroundColor: theme.hex }}>
                  Latest Results
                </Link>
                <Link href={`/${server}/${league}/standings`} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-12 px-8 font-display uppercase tracking-widest border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                  View Standings
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center md:justify-end">
              <img src={logoPath} alt="NEXT Football Logo" className="w-64 md:w-80 lg:w-96 mix-blend-lighten animate-in zoom-in duration-1000" style={{ filter: `drop-shadow(0 0 30px ${theme.hex}55)` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="bg-card border border-border rounded-xl shadow-2xl p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-border/50">
          <StatBox icon={<Trophy className="w-5 h-5" style={{ color: theme.hex }} />} label="Total Matches" value={isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.totalMatches} accentHex={theme.hex} />
          <StatBox icon={<Activity className="w-5 h-5" style={{ color: theme.hex }} />} label="Goals Scored" value={isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.totalGoals} accentHex={theme.hex} />
          <StatBox icon={<Users className="w-5 h-5" style={{ color: theme.hex }} />} label="Teams" value={isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.teamsCount} accentHex={theme.hex} />
          <StatBox icon={<CalendarDays className="w-5 h-5" style={{ color: theme.hex }} />} label="Upcoming" value={isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.upcomingCount} accentHex={theme.hex} />
        </div>
      </section>

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Results */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-display font-bold uppercase tracking-wider flex items-center gap-3">
              <span className="w-3 h-8 block rounded-sm" style={{ backgroundColor: theme.hex }}></span>
              Matchday Results
            </h2>
            <Link href={`/${server}/${league}/results`} className="font-display uppercase tracking-widest text-sm flex items-center gap-1 group transition-colors hover:opacity-80" style={{ color: theme.hex }}>
              All Results <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoadingRecent ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)
            ) : topMatches.length > 0 ? (
              topMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground bg-card rounded-lg border border-dashed border-border">
                No recent matches found.
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Fixtures */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-display font-bold uppercase tracking-wider flex items-center gap-3">
              <span className="w-3 h-8 bg-muted-foreground block rounded-sm"></span>
              Up Next
            </h2>
            <Link href={`/${server}/${league}/fixtures`} className="font-display uppercase tracking-widest text-sm flex items-center gap-1 group transition-colors hover:opacity-80" style={{ color: theme.hex }}>
              All Fixtures <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoadingUpcoming ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)
            ) : nextMatches.length > 0 ? (
              nextMatches.map(match => (
                <MatchCard key={match.id} match={match} variant="compact" />
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground bg-card rounded-lg border border-dashed border-border">
                No upcoming matches scheduled.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, accentHex }: { icon: React.ReactNode; label: string; value: React.ReactNode; accentHex: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4">
      <div className="mb-2 p-2 rounded-full" style={{ backgroundColor: `${accentHex}18` }}>
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-1">{value}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-display">{label}</div>
    </div>
  );
}
