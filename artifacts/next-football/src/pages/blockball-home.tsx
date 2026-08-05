import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { CalendarDays, Goal, Shield, Target, Trophy } from "lucide-react";
import { getBlockballLeague, type BBLeague } from "@/lib/blockball-api";
import { Button } from "@/components/ui/button";

const formatDate = (value: string) => value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "";

export function BlockballHome() {
  const { league = "main" } = useParams<{ league: string }>();
  const code: BBLeague = league === "lower" ? "LL" : "ML";
  const query = useQuery({ queryKey: ["blockball", code], queryFn: () => getBlockballLeague(code) });
  const data = query.data;

  return (
    <div className="container mx-auto space-y-8 px-4 py-10">
      <section className="relative overflow-hidden rounded-[28px] border border-sky-400/20 bg-gradient-to-br from-sky-400/12 via-white/[0.035] to-transparent p-7 md:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.32em] text-sky-400">NEXT BlockBall League</p>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase md:text-6xl">{code === "ML" ? "Major League" : "Lower League"}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Official standings, match results and individual performance leaders for the current BlockBall season.</p>
          </div>
          <div className="flex gap-2 rounded-2xl border border-white/8 bg-black/20 p-1.5">
            <Link href="/blockball/main"><Button variant={code === "ML" ? "default" : "ghost"}>Major League</Button></Link>
            <Link href="/blockball/lower"><Button variant={code === "LL" ? "default" : "ghost"}>Lower League</Button></Link>
          </div>
        </div>
      </section>

      {query.isLoading ? <p>Loading league data...</p> : query.isError ? <p className="text-destructive">League data is currently unavailable.</p> : <>
        <section className="surface-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/8 p-5 md:p-7">
            <div><h2 className="font-display text-2xl font-bold uppercase">League standings</h2><p className="mt-1 text-sm text-muted-foreground">Live table including registered results and manual adjustments.</p></div>
            <Trophy className="h-7 w-7 text-sky-400" />
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[70px_1fr_repeat(8,65px)] border-b border-white/8 bg-white/[0.025] px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span>Pos</span><span>Club</span>{["P","W","D","L","GF","GA","GD","Pts"].map((x) => <span className="text-center" key={x}>{x}</span>)}</div>
              {data.standings.map((row: any) => <div key={row.teamId} className="grid grid-cols-[70px_1fr_repeat(8,65px)] items-center border-b border-white/6 px-6 py-4 transition hover:bg-white/[0.035]"><b className={row.position <= 3 ? "text-sky-400" : ""}>{row.position}</b><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/8 text-xs font-bold text-sky-300">{row.teamCode || row.teamName.slice(0,3).toUpperCase()}</span><b>{row.teamName}</b></div>{[row.played,row.won,row.drawn,row.lost,row.goalsFor,row.goalsAgainst,row.goalDifference,row.points].map((value: any,index: number) => <span key={index} className={`text-center ${index === 7 ? "font-bold text-white" : "text-muted-foreground"}`}>{value}</span>)}</div>)}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
          <section className="surface-panel p-5 md:p-7">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-2xl font-bold uppercase">Latest results</h2><p className="mt-1 text-sm text-muted-foreground">Most recently recorded league matches.</p></div><CalendarDays className="text-sky-400" /></div>
            <div className="space-y-3">{data.matches.length ? data.matches.slice(0,8).map((match: any) => <div key={match.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div><p className="font-semibold">{match.team1}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(match.playedAt)}</p></div><div className="rounded-xl border border-sky-400/20 bg-sky-400/8 px-4 py-2 text-lg font-bold">{match.score1} <span className="text-muted-foreground">–</span> {match.score2}</div><div className="text-right"><p className="font-semibold">{match.team2}</p><p className="mt-1 text-xs text-muted-foreground">{match.matchday ? `Matchday ${match.matchday}` : "League match"}</p></div></div>) : <p className="text-muted-foreground">No results have been recorded yet.</p>}</div>
          </section>

          <section className="surface-panel p-5 md:p-7">
            <h2 className="font-display text-2xl font-bold uppercase">Performance leaders</h2><p className="mt-1 text-sm text-muted-foreground">Top individual contributions in this league.</p>
            <div className="mt-6 space-y-6">{[["Goals",Goal,"goals"],["Assists",Target,"assists"],["Saves",Shield,"saves"]].map(([label,Icon,key]: any) => <div key={key}><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em]"><Icon className="h-4 w-4 text-sky-400" />{label}</h3>{data.leaders[key].slice(0,3).map((player: any,index: number) => <div key={player.uuid} className="flex items-center justify-between border-b border-white/6 py-2.5"><Link href={`/blockball/profile/${player.uuid}`} className="hover:text-sky-400"><span className="mr-2 text-muted-foreground">{index + 1}</span>{player.name}</Link><b>{player[key]}</b></div>)}</div>)}</div>
          </section>
        </div>
      </>}
    </div>
  );
}
