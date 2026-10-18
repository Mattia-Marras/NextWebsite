import { PitchArt } from "@/components/pitch-art";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowRight,
  BarChart3,
  Coins,
  Crown,
  Goal,
  Medal,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Users,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCoinsLeaderboard,
  getNextFootballLeague,
  getRankedLeaderboard,
} from "@/lib/nextfb-api";
import {
  getBlockballEconomy,
  getBlockballLeague,
  getBlockballRanked,
} from "@/lib/blockball-api";

const NUMBER = new Intl.NumberFormat("en-US");

function n(value: number | null | undefined) {
  return NUMBER.format(value ?? 0);
}

function FootballOverview() {
  const [league, setLeague] = useState<"ML" | "LL">("ML");
  const rankedQuery = useQuery({ queryKey: ["football-overview-ranked"], queryFn: () => getRankedLeaderboard({ limit: 5, offset: 0 }) });
  const leagueQuery = useQuery({ queryKey: ["football-overview-league", league], queryFn: () => getNextFootballLeague(league === "ML" ? 1 : 2) });
  const coinsQuery = useQuery({ queryKey: ["football-overview-coins"], queryFn: () => getCoinsLeaderboard({ limit: 5, offset: 0 }) });
  const ranked = rankedQuery.data?.data ?? [];
  const standings = leagueQuery.data?.standings ?? [];
  const rich = coinsQuery.data?.data ?? [];
  const leader = ranked[0];
  const topTeam = standings[0];

  return (
    <ModeOverviewShell
      mode="football"
      eyebrow="NEXT Football"
      title="Football. The competition."
      description="Climb the Football ladder, follow your club through official leagues and explore the players leading the competition."
      loading={false}
      highlightStates={[rankedQuery, leagueQuery, coinsQuery]}
      error={rankedQuery.isError || leagueQuery.isError || coinsQuery.isError}
      highlights={[
        [Trophy, "Ranked leader", leader?.username?.trim() || "—", leader ? `${n(leader.mmr)} MMR · ${leader.rank.displayWithDivision}` : "No ranked data"],
        [Crown, league === "ML" ? "Major League" : "Lower League", topTeam?.teamName || "—", topTeam ? `${n(topTeam.points)} pts · ${n(topTeam.won)} wins` : "No league data"],
        [Coins, "Richest player", rich[0]?.username?.trim() || "—", rich[0] ? `${n(rich[0].coins)} coins` : "No economy data"],
      ]}
      panels={[
        {
          icon: BarChart3,
          kicker: "Ranked",
          loading: rankedQuery.isLoading,
          error: rankedQuery.isError,
          title: "Ranked standings",
          description: "MMR, divisions, season history and performance statistics make every competitive match part of a persistent record.",
          href: "/football/ranked",
          cta: "Open Ranked",
          content: (
            <MiniRanking
              rows={ranked.slice(0, 4).map((player, index) => ({
                position: index + 1,
                name: player.username?.trim() || "Unknown player",
<<<<<<< HEAD
=======
                href: `/football/profile/${encodeURIComponent(player.uuid)}`,
>>>>>>> 5f078c1 (New website rewwork)
                value: `${n(player.mmr)} MMR`,
              }))}
            />
          ),
        },
        {
          icon: Trophy,
          kicker: "League",
          loading: leagueQuery.isLoading,
          error: leagueQuery.isError,
          controls: <LeagueSelector league={league} onChange={setLeague} />,
          title: "League table",
          description: "Follow the Major and Lower League with standings, fixtures, results, seasonal archives and individual league careers.",
          href: league === "ML" ? "/football/main" : "/football/lower",
          cta: "Open League",
          content: (
            <MiniRanking
              rows={standings.slice(0, 4).map((team) => ({
                position: team.position,
                name: team.teamName,
                value: `${n(team.points)} pts`,
              }))}
            />
          ),
        },
        {
          icon: WalletCards,
          kicker: "Economy",
          loading: coinsQuery.isLoading,
          error: coinsQuery.isError,
          title: "Rewards beyond the result",
          description: "Coins, rewards, cosmetics and GameBet activity create an economy that connects play, progression and collection.",
          href: "/football/leaderboards?tab=coins",
          cta: "Explore economy",
          content: (
<<<<<<< HEAD
            <MiniRanking rows={rich.slice(0, 4).map((player, index) => ({ position: index + 1, name: player.username?.trim() || "Unknown player", value: `${n(player.coins)} coins` }))} />
=======
            <MiniRanking rows={rich.slice(0, 4).map((player, index) => ({ position: index + 1, name: player.username?.trim() || "Unknown player",
                href: `/football/profile/${encodeURIComponent(player.uuid)}`, value: `${n(player.coins)} coins` }))} />
>>>>>>> 5f078c1 (New website rewwork)
          ),
        },
      ]}
    />
  );
}

function BlockballOverview() {
  const [league, setLeague] = useState<"ML" | "LL">("ML");
  const rankedQuery = useQuery({ queryKey: ["blockball-overview-ranked"], queryFn: getBlockballRanked });
  const leagueQuery = useQuery({ queryKey: ["blockball-overview-league", league], queryFn: () => getBlockballLeague(league) });
  const economyQuery = useQuery({ queryKey: ["blockball-overview-economy"], queryFn: getBlockballEconomy });
  const ranked = rankedQuery.data?.leaderboard ?? [];
  const standings = leagueQuery.data?.standings ?? [];
  const economy = economyQuery.data;
  const richest = economy?.richest ?? [];
  const leader = ranked[0];
  const topTeam = standings[0];

  return (
    <ModeOverviewShell
      mode="blockball"
      eyebrow="NEXT BlockBall"
      title="BlockBall. On the board."
      description="Climb the BlockBall ladder, follow Major and Lower League, and discover the cards and cosmetics behind every player’s career."
      loading={false}
      highlightStates={[rankedQuery, leagueQuery, economyQuery]}
      error={rankedQuery.isError || leagueQuery.isError || economyQuery.isError}
      highlights={[
        [Medal, "Ranked leader", leader?.name || "—", leader ? `${n(leader.mmr)} MMR · ${leader.rank.displayName}` : "No ranked data"],
        [Trophy, league === "ML" ? "Major League" : "Lower League", topTeam?.teamName || "—", topTeam ? `${n(topTeam.points)} pts · ${n(topTeam.won)} wins` : "No league data"],
        [Coins, "Top balance", richest[0]?.name || "—", richest[0] ? `${n(richest[0].coins)} coins` : "No economy data"],
      ]}
      panels={[
        {
          icon: BarChart3,
          kicker: "Ranked",
          loading: rankedQuery.isLoading,
          error: rankedQuery.isError,
          title: "Ranked standings",
          description: "Track MMR, rank, win rate and match statistics across the live BlockBall ladder.",
          href: "/blockball/ranked",
          cta: "Open Ranked",
          content: (
            <MiniRanking
              rows={ranked.slice(0, 4).map((player: any, index: number) => ({
                position: index + 1,
                name: player.name,
<<<<<<< HEAD
=======
                href: player.uuid ? `/blockball/profile/${encodeURIComponent(player.uuid)}` : undefined,
>>>>>>> 5f078c1 (New website rewwork)
                value: `${n(player.mmr)} MMR`,
              }))}
            />
          ),
        },
        {
          icon: Trophy,
          kicker: "League",
          loading: leagueQuery.isLoading,
          error: leagueQuery.isError,
          controls: <LeagueSelector league={league} onChange={setLeague} />,
          title: "League table",
          description: "Standings, latest results, performance leaders, season archives and awards stay connected to every player profile.",
          href: league === "ML" ? "/blockball/main" : "/blockball/lower",
          cta: "Open League",
          content: (
            <MiniRanking
              rows={standings.slice(0, 4).map((team: any) => ({
                position: team.position,
                name: team.teamName,
                value: `${n(team.points)} pts`,
              }))}
            />
          ),
        },
        {
          icon: Coins,
          kicker: "Economy",
          loading: economyQuery.isLoading,
          error: economyQuery.isError,
          title: "Build your collection",
          description: "Player balances, cosmetics and Ultimate Team ownership give matches a persistent layer beyond a single game.",
          href: "/blockball/players",
          cta: "Find a player",
          content: (
            <div className="grid grid-cols-2 gap-3">
              <MiniMetric label="Coins in circulation" value={n(economy?.totalCoins)} />
              <MiniMetric label="Average balance" value={n(economy?.averageCoins)} />
              <MiniMetric label="Largest balance" value={n(economy?.maxCoins)} />
              <MiniMetric label="Tracked players" value={n(economy?.playerCount)} />
            </div>
          ),
        },
      ]}
    />
  );
}

type Highlight = [typeof Trophy, string, string, string];
type Panel = {
  icon: typeof Trophy;
  kicker: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  content: React.ReactNode;
  controls?: React.ReactNode;
  loading?: boolean;
  error?: boolean;
};

function ModeOverviewShell({
  mode,
  eyebrow,
  title,
  description,
  loading,
  error,
  highlights,
  highlightStates,
  panels,
}: {
  mode: "football" | "blockball";
  eyebrow: string;
  title: string;
  description: string;
  loading: boolean;
  error: boolean;
  highlights: Highlight[];
  highlightStates: { isLoading: boolean; isError: boolean }[];
  panels: Panel[];
}) {
  const accent = mode === "football" ? "#39ff14" : "#38bdf8";
  const accentRgb = mode === "football" ? "57,255,20" : "56,189,248";

  return (
    <div className={`next-editorial next-mode next-${mode} relative overflow-hidden pb-16 page-reveal`}>
      <section className="relative border-b border-white/8">
        <div className="next-mode-art"><PitchArt blockball={mode === "blockball"}/></div>
<<<<<<< HEAD
        <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
=======
        <div className="container mx-auto px-4 py-10 md:py-12 lg:py-14">
>>>>>>> 5f078c1 (New website rewwork)
          <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10" style={{ background: accent }} />
                <p className="font-display text-xs font-semibold uppercase tracking-[0.34em]" style={{ color: accent }}>{eyebrow}</p>
              </div>
              <h1 className="mt-5 max-w-4xl font-display text-5xl font-bold uppercase leading-[.94] tracking-tight md:text-7xl">{title}</h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={`/${mode}/players`}><Button size="lg" style={{ backgroundColor: accent, color: "#061008" }}>Find a player <Users className="ml-2 h-4 w-4" /></Button></Link>
                <Link href={`/${mode}/ranked`}><Button size="lg" variant="outline">View Ranked <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {loading ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />) : highlights.map(([Icon, label, value, detail], index) => (
                <div key={label} className="hover-lift relative overflow-hidden rounded-2xl border border-white/10 bg-[#10161f]/80 p-4 backdrop-blur-xl">
                  <div className="absolute inset-y-0 left-0 w-px" style={{ background: `linear-gradient(transparent, ${accent}, transparent)` }} />
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-xl border p-2" style={{ color: accent, borderColor: `rgba(${accentRgb},.24)`, background: `rgba(${accentRgb},.07)` }}><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-1 truncate font-display text-xl font-bold uppercase">{highlightStates[index]?.isLoading ? "Loading…" : highlightStates[index]?.isError ? "Unavailable" : value}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{highlightStates[index]?.isLoading ? "Fetching latest results" : highlightStates[index]?.isError ? "Please try again shortly" : detail}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="container relative mx-auto space-y-9 px-4 pt-9">
        {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">Some results are temporarily unavailable. You can still explore the other sections.</div> : null}

        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.26em] text-muted-foreground">Ranked / League / Economy</p>
              <h2 className="mt-1 font-display text-3xl font-bold uppercase md:text-4xl">The competition desk</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">Check the leaders, follow the league race and explore player progression.</p>
          </div>

          <div className="next-mode-panels">
            {panels.map((panel, index) => {
              const Icon = panel.icon;
              return (
                <article key={panel.kicker} className={`next-mode-panel next-mode-panel-${index} group relative overflow-hidden p-5 md:p-7`}>
                  <div className="shine-line absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border" style={{ color: accent, borderColor: `rgba(${accentRgb},.24)`, background: `rgba(${accentRgb},.07)` }}><Icon className="h-5 w-5" /></span>
                    
                  </div>
                  <p className="mt-5 font-display text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: accent }}>{panel.kicker}</p>
                  <h3 className="mt-1 font-display text-2xl font-bold uppercase">{panel.title}</h3>
                  <p className="mt-3 min-h-[66px] text-sm leading-relaxed text-muted-foreground">{panel.description}</p>
                  {panel.controls}<div className="mt-5 min-h-[154px] rounded-2xl border border-white/8 bg-black/15 p-3">{panel.loading ? <Skeleton className="h-32 w-full rounded-xl" /> : panel.error ? <p role="status" className="p-3 text-sm text-muted-foreground">This section is temporarily unavailable. Try again shortly or open the full page below.</p> : panel.content}</div>
                  <Link href={panel.href} className="mt-5 flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.1em] transition hover:bg-white/[0.04]" style={{ color: accent }}>
                    {panel.cta}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

<<<<<<< HEAD
        <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.025] p-6 md:p-8">
            <Sparkles className="h-6 w-6" style={{ color: accent }} />
            <h2 className="mt-5 font-display text-3xl font-bold uppercase">Find a player.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Search a player to see their rank, league record, awards and collection. Follow your own progress or discover the competition.</p>
            <Link href={`/${mode}/players`} className="mt-6 inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.1em]" style={{ color: accent }}>Search player profiles <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-[#10161f]/80 p-6 md:p-8">
            <p className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">{mode === "blockball" ? "Collect your favourites" : "Make your mark"}</p><h3 className="mt-3 font-display text-2xl font-bold uppercase">{mode === "blockball" ? "Discover Ultimate Team" : "Follow every season"}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{mode === "blockball" ? "Explore player cards, compare their attributes and view the collections on player profiles." : "Follow league standings, match results and the players making a difference."}</p><Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: accent }} href={mode === "blockball" ? "/blockball/ultimate-team" : "/football/main"}>{mode === "blockball" ? "Explore cards" : "Follow the league"}<ArrowRight className="h-4 w-4" /></Link>

          </div>
        </section>
=======
        <nav className="next-overview-links" aria-label="More mode pages">
          <Link href={`/${mode}/players`}>Find a player <ArrowRight size={16}/></Link>
          <Link href={`/${mode}/ultimate-team`}>Ultimate Team <ArrowRight size={16}/></Link>
          <Link href={`/${mode}/leaderboards`}>Leaderboards <ArrowRight size={16}/></Link>
          {mode === "blockball" && <Link href="/blockball/main/archive">Season archive <ArrowRight size={16}/></Link>}
        </nav>
>>>>>>> 5f078c1 (New website rewwork)
      </main>
    </div>
  );
}

function LeagueSelector({ league, onChange }: { league: "ML" | "LL"; onChange: (value: "ML" | "LL") => void }) {
  return <div className="mt-4 flex gap-2" role="group" aria-label="League preview">{(["ML", "LL"] as const).map(code => <button type="button" key={code} aria-pressed={league === code} onClick={() => onChange(code)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${league === code ? "border-white/25 bg-white/10 text-white" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}>{code === "ML" ? "Major League" : "Lower League"}</button>)}</div>;
}

<<<<<<< HEAD
function MiniRanking({ rows }: { rows: { position: number; name: string; value: string }[] }) {
  if (!rows.length) return <p className="p-3 text-sm text-muted-foreground">No live data available.</p>;
  return <div>{rows.map((row) => <div key={`${row.position}-${row.name}`} className="grid grid-cols-[30px_1fr_auto] items-center gap-2 border-b border-white/6 px-2 py-2.5 last:border-0"><b className="font-display text-muted-foreground">{row.position}</b><span className="truncate text-sm font-semibold">{row.name}</span><span className="text-xs text-muted-foreground">{row.value}</span></div>)}</div>;
=======
function MiniRanking({ rows }: { rows: { position: number; name: string; value: string; href?: string }[] }) {
  if (!rows.length) return <p className="p-3 text-sm text-muted-foreground">No live data available.</p>;
  return <div>{rows.map((row) => <div key={`${row.position}-${row.name}`} className="grid grid-cols-[30px_1fr_auto] items-center gap-2 border-b border-white/6 px-2 py-2.5 last:border-0"><b className="font-display text-muted-foreground">{row.position}</b><span className="truncate text-sm font-semibold">{row.href ? <Link href={row.href} className="hover:underline underline-offset-4">{row.name}</Link> : row.name}</span><span className="text-xs text-muted-foreground">{row.value}</span></div>)}</div>;
>>>>>>> 5f078c1 (New website rewwork)
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/7 bg-white/[0.02] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p><b className="mt-1 block text-lg">{value}</b></div>;
}

export { FootballOverview, BlockballOverview };
