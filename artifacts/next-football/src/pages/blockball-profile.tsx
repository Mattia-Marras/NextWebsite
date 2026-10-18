import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Activity, Award, Coins, Crown, History, Package, Shield, Swords, Trophy, WalletCards } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getBlockballPlayer } from "@/lib/blockball-api";
import { getBlockballUltimateTeamCollection } from "@/lib/blockball-api";
import { BlockballUltimateTeamCard } from "@/components/blockball-ultimate-team-card";

const N = (value: unknown) => new Intl.NumberFormat("en-US").format(Number(value) || 0);
const pretty = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function BlockballProfile() {
  const { uuid = "" } = useParams<{ uuid: string }>();
  const query = useQuery({ queryKey: ["bb-player", uuid], queryFn: () => getBlockballPlayer(uuid) });
  const utQuery = useQuery({ queryKey: ["bb-player-ut", uuid], queryFn: () => getBlockballUltimateTeamCollection(uuid), enabled: Boolean(uuid) });
  if (query.isLoading) return <div className="container mx-auto space-y-5 px-4 py-10" role="status" aria-label="Loading player profile"><div className="h-52 animate-pulse rounded-[28px] bg-white/5"/><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({length:4},(_,index)=><div key={index} className="h-40 animate-pulse rounded-2xl bg-white/5"/>)}</div><p className="text-sm text-muted-foreground">Loading player profile…</p></div>;
  if (query.isError || !query.data) return <div className="container mx-auto space-y-4 p-10"><h1 className="font-display text-3xl font-bold uppercase">Profile unavailable</h1><p className="text-muted-foreground">We couldn’t load this player. Check the name or try again in a moment.</p><button onClick={() => query.refetch()} className="rounded-xl border border-sky-400/30 px-4 py-2 text-sky-400">Try again</button><Link href="/blockball/players" className="ml-4 text-sky-400">Find a player →</Link></div>;

  const player = query.data;
  const ranked = player.ranked;
  const career = player.leagueHistory?.career;
  const careerMatches = Number(career?.matches) || 0;
  const awards = (player.leagueHistory?.awards ?? []).reduce((sum: number, award: any) => sum + (Number(award.amount) || 1), 0);
  const perMatch = (value: unknown) => careerMatches > 0 ? ((Number(value) || 0) / careerMatches).toFixed(2) : "—";
  const games = ranked ? ranked.games : 0;
  const winRate = ranked ? ranked.winRate : 0;
  const history = ranked?.history?.map((entry: any, index: number) => {
    const date = entry.createdAt ? new Date(entry.createdAt) : null;
    const validDate = date && !Number.isNaN(date.getTime());
    return {
      label: validDate
        ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date)
        : `Match ${entry.sequence || index + 1}`,
      mmr: entry.mmr,
      index: index + 1,
    };
  }) || [];

  return (
    <div className="next-editorial next-player next-blockball container mx-auto space-y-7 px-4 py-10 page-reveal">
      <Link href="/blockball/players" className="text-sm font-semibold text-sky-400 hover:text-sky-300">← Find another player</Link>

      <section className="relative overflow-hidden next-player-header border border-white/15 p-7 md:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">BlockBall / Player record</p>
            <h1 className="mt-3 break-words font-display text-4xl font-bold uppercase md:text-6xl">{player.name}</h1>
          </div>
          {ranked && <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current competitive rank</p><p className="mt-1 text-2xl font-bold text-sky-400">{ranked.rank.displayName}</p><p className="text-sm">{N(ranked.mmr)} MMR</p></div>}
        </div>
      </section>

      <nav aria-label="Player sections" className="profile-jump-nav flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#10161f]/90 p-2 backdrop-blur-xl">
        {[["overview","Overview"],["ranked","Ranked"],["league","League career"],["collection","Ultimate Team"],["rewards","Rewards & GameBet"]].map(([id,label]) => <a key={id} href={`#bb-${id}`} className="shrink-0 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-sky-400/10 hover:text-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">{label}</a>)}
      </nav>
      <section id="bb-overview">
        <div className="mb-4"><p className="font-display text-xs uppercase tracking-[0.24em] text-muted-foreground">Player overview</p><h2 className="mt-1 font-display text-3xl font-bold uppercase">Player record</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="hover-lift relative overflow-hidden rounded-2xl border border-sky-400/20 bg-sky-400/[0.045] p-5"><div className="shine-line absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400 to-transparent"/><Swords className="h-5 w-5 text-sky-400"/><p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">Competitive status</p><b className="mt-1 block font-display text-2xl uppercase">{ranked?.rank.displayName || "Unranked"}</b><p className="mt-1 text-sm text-muted-foreground">{ranked ? `${N(ranked.mmr)} MMR · ${N(ranked.wins)}W / ${N(ranked.losses)}L` : "No Ranked record yet"}</p></div>
          <div className="hover-lift rounded-2xl border border-white/10 bg-white/[0.025] p-5"><Trophy className="h-5 w-5 text-sky-400"/><p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">League career</p><b className="mt-1 block font-display text-2xl uppercase">{player.leagueHistory?.career ? `${N(player.leagueHistory.career.matches)} matches` : "No history"}</b><p className="mt-1 text-sm text-muted-foreground">{player.leagueHistory?.career ? `${N(player.leagueHistory.career.goals)} goals · ${N(player.leagueHistory.career.assists)} assists · ${N(awards)} awards` : "No finalized league stats"}</p></div>
          <div className="hover-lift rounded-2xl border border-white/10 bg-white/[0.025] p-5"><Coins className="h-5 w-5 text-sky-400"/><p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">Economy</p><b className="mt-1 block font-display text-2xl uppercase">{N(player.coins)} coins</b><p className="mt-1 text-sm text-muted-foreground">{player.casino ? `${N(player.casino.totalPlays)} GameBet plays · ${N(player.casino.totalBet)} wagered` : "No GameBet activity"}</p></div>
          <div className="hover-lift rounded-2xl border border-white/10 bg-white/[0.025] p-5"><Crown className="h-5 w-5 text-sky-400"/><p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">Progression</p><b className="mt-1 block font-display text-2xl uppercase">Level {N(player.level)}</b><p className="mt-1 text-sm text-muted-foreground">{N(player.xp)} XP · {N(player.cosmetics.length)} cosmetics · {utQuery.isLoading ? "Loading cards…" : utQuery.isError ? "Collection unavailable" : `${N(utQuery.data?.total)} card types`}</p></div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="surface-panel p-5 md:p-7"><p className="font-display text-xs uppercase tracking-[.2em] text-sky-400">League performance</p><h2 className="mt-2 font-display text-2xl font-bold uppercase">League averages</h2><p className="mt-2 text-sm text-muted-foreground">Averages from recorded league career totals · {N(careerMatches)} matches.</p><div className="mt-5 grid grid-cols-3 gap-3">{[["Goals",perMatch(career?.goals)],["Assists",perMatch(career?.assists)],["Saves",perMatch(career?.saves)]].map(([label,value]) => <div key={label} className="rounded-xl border border-sky-400/15 bg-sky-400/5 p-3"><p className="text-xs text-muted-foreground">{label} / match</p><b className="mt-2 block text-2xl">{value}</b></div>)}</div></div>
        <div className="surface-panel p-5 md:p-7"><p className="font-display text-xs uppercase tracking-[.2em] text-sky-400">Career highlights</p><h2 className="mt-2 font-display text-2xl font-bold uppercase">Career honours</h2><div className="mt-5 space-y-3">{[["Peak Ranked MMR",ranked ? N(ranked.peakMmr) : "—"],["League awards",N(awards)],["Recorded seasons",N(player.leagueHistory?.seasons?.length)],["Active cosmetics",N(player.activeCosmetics?.length)]].map(([label,value]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-white/8 pb-3"><span className="text-sm text-muted-foreground">{label}</span><b>{value}</b></div>)}</div><a href="#bb-league" className="mt-4 inline-block text-sm font-semibold text-sky-400">Explore the full career →</a></div>
      </section>
      <section id="bb-ranked" className="surface-panel overflow-hidden">
        <div className="border-b border-white/8 p-5 md:p-7"><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><Swords className="text-sky-400"/> Ranked performance</h2><p className="mt-1 text-sm text-muted-foreground">Complete competitive record and progression.</p></div>
        {ranked ? <div className="p-5 md:p-7">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[["MMR",N(ranked.mmr)],["Wins",N(ranked.wins)],["Losses",N(ranked.losses)],["Matches",N(games)],["Win rate",`${winRate.toFixed(1)}%`]].map(([label,value]) => <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <h3 className="flex items-center gap-2 font-semibold"><Activity className="h-5 w-5 text-sky-400"/> MMR progression</h3>
              <div className="mt-4 h-[300px]">
                {history.length > 1 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={history} margin={{top:8,right:15,left:0,bottom:8}}><CartesianGrid strokeDasharray="3 3" opacity={0.12}/><XAxis dataKey="label" tick={{fontSize:11}}/><YAxis domain={["dataMin - 50","dataMax + 50"]} tick={{fontSize:11}}/><Tooltip contentStyle={{background:"#0b1017",border:"1px solid rgba(255,255,255,.1)",borderRadius:12}}/><Line type="monotone" dataKey="mmr" stroke="currentColor" className="text-sky-400" strokeWidth={3} dot={{r:3}} activeDot={{r:5}}/></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">Play more Ranked matches to reveal your progression chart.</div>}
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5"><h3 className="flex items-center gap-2 font-semibold"><Shield className="h-5 w-5 text-sky-400"/> Ranked statistics</h3><div className="mt-4 space-y-2">{Object.keys(ranked.stats).length ? Object.entries(ranked.stats).sort(([a],[b])=>a.localeCompare(b)).map(([key,value]) => <div key={key} className="flex items-center justify-between border-b border-white/6 py-2.5"><span className="text-sm text-muted-foreground">{pretty(key)}</span><b>{N(value)}</b></div>) : <p className="text-sm text-muted-foreground">No ranked statistics recorded.</p>}</div></div>
          </div>
        </div> : <p className="p-7 text-muted-foreground">This player has not entered ranked competition yet.</p>}
      </section>

      <div id="bb-rewards" className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel p-5 md:p-7"><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><WalletCards className="text-sky-400"/> GameBet activity</h2>{player.casino ? <div className="mt-5 grid grid-cols-2 gap-3">{Object.entries(player.casino).map(([key,value]) => <div key={key} className="rounded-xl border border-white/8 bg-white/[0.02] p-3"><p className="text-xs text-muted-foreground">{pretty(key)}</p><b className="mt-1 block text-lg">{N(value)}</b></div>)}</div> : <p className="mt-4 text-muted-foreground">No GameBet activity recorded.</p>}</section>
        <section className="surface-panel p-5 md:p-7"><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><Package className="text-sky-400"/> Cosmetics</h2><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/8 p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Owned</p><b className="mt-1 block text-2xl">{player.cosmetics.length}</b></div><div className="rounded-xl border border-white/8 p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Active</p><b className="mt-1 block text-2xl">{player.activeCosmetics.length}</b></div></div><div className="mt-4 flex flex-wrap gap-2">{player.cosmetics.map((item:string) => <span key={item} className="rounded-full border border-sky-400/25 bg-sky-400/5 px-3 py-1 text-xs">{pretty(item)}</span>)}</div></section>
      </div>

      <section id="bb-collection" className="surface-panel p-5 md:p-7">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><WalletCards className="text-sky-400"/> Ultimate Team collection</h2>
        <p className="mt-1 text-sm text-muted-foreground">Cards and duplicate quantities owned by this player across S1 and S2.</p>
        {utQuery.isLoading ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-72 animate-pulse rounded-2xl bg-white/5"/>)}</div> : utQuery.isError ? <p className="mt-5 text-destructive">Could not load this collection.</p> : utQuery.data?.data.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{utQuery.data.data.map(card=><BlockballUltimateTeamCard key={card.id} card={card} showOwnership/>)}</div> : <p className="mt-5 text-muted-foreground">This player does not own any BlockBall UT cards yet.</p>}
      </section>

      <section id="bb-league" className="surface-panel p-5 md:p-7">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><History className="text-sky-400"/> League career</h2>
        <p className="mt-1 text-sm text-muted-foreground">Complete BlockBall league history across recorded seasons.</p>
        {player.leagueHistory?.career ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Matches",player.leagueHistory.career.matches],["Goals",player.leagueHistory.career.goals],["Assists",player.leagueHistory.career.assists],["Saves",player.leagueHistory.career.saves],["Wins",player.leagueHistory.career.wins],["Draws",player.leagueHistory.career.draws],["Losses",player.leagueHistory.career.losses],["Clean sheets",player.leagueHistory.career.cleanSheets]].map(([name,value])=><div key={name} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{name}</p><b className="mt-1 block text-2xl">{N(value)}</b></div>)}</div> : <p className="mt-5 text-muted-foreground">No finalized career statistics recorded.</p>}

        <div className="mt-8"><h3 className="font-display text-lg font-bold uppercase">Season by season</h3><div className="mt-4 space-y-3">{player.leagueHistory?.seasons?.length ? player.leagueHistory.seasons.map((item:any)=><div key={`${item.league}-${item.season}`} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><b className="text-sky-400">{item.league === "ML" ? "Major League" : item.league === "LL" ? "Lower League" : item.league}</b><span className="ml-2 text-sm text-muted-foreground">Season {item.season}</span></div><span className={`rounded-full px-2.5 py-1 text-xs ${item.finalized ? "bg-white/5 text-muted-foreground" : "bg-sky-400/10 text-sky-300"}`}>{item.finalized ? "Past season" : "Current"}</span></div><div className="mt-4 grid grid-cols-4 gap-2 text-center sm:grid-cols-8">{[["MP",item.matches],["W",item.wins],["D",item.draws],["L",item.losses],["G",item.goals],["A",item.assists],["S",item.saves],["CS",item.cleanSheets]].map(([k,v])=><div key={k} className="rounded-xl border border-white/6 p-2"><p className="text-[10px] text-muted-foreground">{k}</p><b>{N(v)}</b></div>)}</div></div>) : <p className="text-muted-foreground">No seasonal history recorded.</p>}</div></div>

        <div className="mt-8"><h3 className="flex items-center gap-2 font-display text-lg font-bold uppercase"><Award className="h-5 w-5 text-amber-300"/> Awards</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{player.leagueHistory?.awards?.length ? player.leagueHistory.awards.map((item:any,index:number)=><div key={`${item.league}-${item.season}-${item.awardType}-${index}`} className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">{pretty(item.awardType)}</p><p className="mt-2 font-semibold">{item.league} · Season {item.season}</p>{Number(item.amount)>1 && <p className="mt-1 text-sm text-muted-foreground">Awarded × {item.amount}</p>}</div>) : <p className="text-muted-foreground">No league awards recorded.</p>}</div></div>
      </section>
    </div>
  );
}
