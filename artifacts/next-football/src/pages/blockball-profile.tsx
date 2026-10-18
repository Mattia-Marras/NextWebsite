import { dateFormatter, numberFormatter, translate, useLanguage } from "@/i18n";
import { useState } from "react";
import { SectionNav } from "@/components/section-nav";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Activity, Award, Coins, Crown, History, Package, Shield, Swords, Trophy, WalletCards } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getBlockballPlayer } from "@/lib/blockball-api";
import { getBlockballUltimateTeamCollection } from "@/lib/blockball-api";
import { BlockballUltimateTeamCard } from "@/components/blockball-ultimate-team-card";

const N = (value: unknown) => numberFormatter("en-US").format(Number(value) || 0);
const pretty = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function BlockballProfile() {
  useLanguage();
  const { uuid = "", section: requestedSection = "overview" } = useParams<{ uuid: string; section?: string }>();
  const sections = [["overview","Overview"],["ranked","Ranked"],["league","League"],["ultimate-team","Ultimate Team"],["cosmetics","Cosmetics"],["gamebet","GameBet"]] as const;
  const section = sections.some(([key]) => key === requestedSection) ? requestedSection : "overview";
  const base = `/blockball/profile/${encodeURIComponent(uuid)}`;
  const [cardSearch, setCardSearch] = useState("");
  const [cardSeason, setCardSeason] = useState("");
  const [cardPage, setCardPage] = useState(1);
  const query = useQuery({ queryKey: ["bb-player", uuid], queryFn: () => getBlockballPlayer(uuid) });
  const utQuery = useQuery({ queryKey: ["bb-player-ut", uuid], queryFn: () => getBlockballUltimateTeamCollection(uuid), enabled: Boolean(uuid) && section === "ultimate-team" });
  if (query.isLoading) return <div className="container mx-auto space-y-5 px-4 py-10" role="status" aria-label={translate("Loading player profile")}><div className="h-52 animate-pulse rounded-[28px] bg-white/5"/><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({length:4},(_,index)=><div key={index} className="h-40 animate-pulse rounded-2xl bg-white/5"/>)}</div><p className="text-sm text-muted-foreground">{translate("Loading player profile…")}</p></div>;
  if (query.isError || !query.data) return <div className="container mx-auto space-y-4 p-10"><h1 className="font-display text-3xl font-bold uppercase">{translate("Profile unavailable")}</h1><p className="text-muted-foreground">{translate("We couldn’t load this player. Check the name or try again in a moment.")}</p><button onClick={() => query.refetch()} className="rounded-xl border border-sky-400/30 px-4 py-2 text-sky-400">{translate("Try again")}</button><Link href="/blockball/players" className="ml-4 text-sky-400">{translate("Find a player →")}</Link></div>;

  const cards = utQuery.data?.data ?? [];
  const filteredCards = cards.filter(card => (!cardSeason || card.seasonId === cardSeason) && `${card.username ?? ""} ${card.position} ${card.cardType}`.toLowerCase().includes(cardSearch.trim().toLowerCase()));
  const cardPages = Math.max(1, Math.ceil(filteredCards.length / 12));
  const currentCardPage = Math.min(cardPage, cardPages);
  const visibleCards = filteredCards.slice((currentCardPage - 1) * 12, currentCardPage * 12);
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
        ? dateFormatter("en-GB", { day: "2-digit", month: "short" }).format(date)
        : `Match ${entry.sequence || index + 1}`,
      mmr: entry.mmr,
      index: index + 1,
    };
  }) || [];

  return (
    <div className="next-editorial next-player next-blockball container mx-auto space-y-7 px-4 py-10 page-reveal">
      <Link href="/blockball/players" className="text-sm font-semibold text-sky-400 hover:text-sky-300">{translate("← Find another player")}</Link>

      <section className="relative overflow-hidden next-player-header border border-white/15 p-7 md:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">{translate("BlockBall / Player record")}</p>
            <h1 className="mt-3 break-words font-display text-4xl font-bold uppercase md:text-6xl">{player.name}</h1>
          </div>
          {ranked && <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{translate("Current competitive rank")}</p><p className="mt-1 text-2xl font-bold text-sky-400">{ranked.rank.displayName}</p><p className="text-sm">{N(ranked.mmr)}{translate(" MMR")}</p></div>}
        </div>
      </section>

      <SectionNav base={base} active={section} items={sections} label={translate("Player sections")} />
      {section === "overview" && <>
      <section id="bb-overview">
        <div className="mb-4"><p className="font-display text-xs uppercase tracking-[0.24em] text-muted-foreground">{translate("Player overview")}</p><h2 className="mt-1 font-display text-3xl font-bold uppercase">{translate("Player record")}</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="hover-lift relative overflow-hidden rounded-2xl border border-sky-400/20 bg-sky-400/[0.045] p-5"><div className="shine-line absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400 to-transparent"/><Swords className="h-5 w-5 text-sky-400"/><p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">{translate("Ranked record")}</p><b className="mt-1 block font-display text-2xl uppercase">{ranked ? translate("{0} matches", [N(ranked.games)], ranked.games) : translate("Unranked")}</b><p className="mt-1 text-sm text-muted-foreground">{ranked ? translate("{0}W / {1}L · {2}% wins", [N(ranked.wins), N(ranked.losses), Number(ranked.winRate).toFixed(1)]) : translate("No Ranked record yet")}</p></div>
          <div className="hover-lift rounded-2xl border border-white/10 bg-white/[0.025] p-5"><Trophy className="h-5 w-5 text-sky-400"/><p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">{translate("League career")}</p><b className="mt-1 block font-display text-2xl uppercase">{player.leagueHistory?.career ? translate("{0} matches", [N(player.leagueHistory.career.matches)], player.leagueHistory.career.matches) : translate("No history")}</b><p className="mt-1 text-sm text-muted-foreground">{player.leagueHistory?.career ? translate("{0} goals · {1} assists · {2} awards", [N(player.leagueHistory.career.goals), N(player.leagueHistory.career.assists), N(awards)]) : translate("No finalized league stats")}</p></div>
          <div className="hover-lift rounded-2xl border border-white/10 bg-white/[0.025] p-5"><Coins className="h-5 w-5 text-sky-400"/><p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">{translate("Economy")}</p><b className="mt-1 block font-display text-2xl uppercase">{N(player.coins)}{translate(" coins")}</b><p className="mt-1 text-sm text-muted-foreground">{player.casino ? translate("{0} GameBet plays · {1} wagered", [N(player.casino.totalPlays), N(player.casino.totalBet)]) : translate("No GameBet activity")}</p></div>
          <div className="hover-lift rounded-2xl border border-white/10 bg-white/[0.025] p-5"><Crown className="h-5 w-5 text-sky-400"/><p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">{translate("Progression")}</p><b className="mt-1 block font-display text-2xl uppercase">{translate("Level ")}{N(player.level)}</b><p className="mt-1 text-sm text-muted-foreground">{N(player.xp)}{translate(" XP · ")}{N(player.cosmetics.length)}{translate(" cosmetics · View Ultimate Team collection")}</p></div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="surface-panel p-5 md:p-7"><p className="font-display text-xs uppercase tracking-[.2em] text-sky-400">{translate("League performance")}</p><h2 className="mt-2 font-display text-2xl font-bold uppercase">{translate("League averages")}</h2><p className="mt-2 text-sm text-muted-foreground">{translate("Averages from recorded league career totals · ")}{N(careerMatches)}{translate(" matches.")}</p><div className="mt-5 grid grid-cols-3 gap-3">{[["Goals",perMatch(career?.goals)],["Assists",perMatch(career?.assists)],["Saves",perMatch(career?.saves)]].map(([label,value]) => <div key={label} className="rounded-xl border border-sky-400/15 bg-sky-400/5 p-3"><p className="text-xs text-muted-foreground">{translate(label)}{translate(" / match")}</p><b className="mt-2 block text-2xl">{value}</b></div>)}</div></div>
        <div className="surface-panel p-5 md:p-7"><p className="font-display text-xs uppercase tracking-[.2em] text-sky-400">{translate("Career highlights")}</p><h2 className="mt-2 font-display text-2xl font-bold uppercase">{translate("Career honours")}</h2><div className="mt-5 space-y-3">{[["Peak Ranked MMR",ranked ? N(ranked.peakMmr) : "—"],["League awards",N(awards)],["Recorded seasons",N(player.leagueHistory?.seasons?.length)],["Active cosmetics",N(player.activeCosmetics?.length)]].map(([label,value]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-white/8 pb-3"><span className="text-sm text-muted-foreground">{translate(label)}</span><b>{value}</b></div>)}</div><Link href={`${base}/league`} className="mt-4 inline-block text-sm font-semibold text-sky-400">{translate("Explore the full career →")}</Link></div>
      </section>
        <div className="next-overview-links">{sections.slice(1).map(([key,label])=><Link key={key} href={`${base}/${key}`}>{translate(label)}<span aria-hidden="true">→</span></Link>)}</div>
      </>}
      {section === "ranked" && <section id="bb-ranked" className="surface-panel overflow-hidden">
        <div className="border-b border-white/8 p-5 md:p-7"><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><Swords className="text-sky-400"/>{translate(" Ranked performance")}</h2><p className="mt-1 text-sm text-muted-foreground">{translate("Complete competitive record and progression.")}</p></div>
        {ranked ? <div className="p-5 md:p-7">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[["MMR",N(ranked.mmr)],["Wins",N(ranked.wins)],["Losses",N(ranked.losses)],["Matches",N(games)],["Win rate",`${winRate.toFixed(1)}%`]].map(([label,value]) => <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{translate(label)}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <h3 className="flex items-center gap-2 font-semibold"><Activity className="h-5 w-5 text-sky-400"/>{translate(" MMR progression")}</h3>
              <div className="mt-4 h-[300px]">
                {history.length > 1 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={history} margin={{top:8,right:15,left:0,bottom:8}}><CartesianGrid strokeDasharray="3 3" opacity={0.12}/><XAxis dataKey="label" tick={{fontSize:11}}/><YAxis domain={["dataMin - 50","dataMax + 50"]} tick={{fontSize:11}}/><Tooltip contentStyle={{background:"#0b1017",border:"1px solid rgba(255,255,255,.1)",borderRadius:12}}/><Line type="monotone" dataKey="mmr" stroke="currentColor" className="text-sky-400" strokeWidth={3} dot={{r:3}} activeDot={{r:5}}/></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">{translate("Play more Ranked matches to reveal your progression chart.")}</div>}
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5"><h3 className="flex items-center gap-2 font-semibold"><Shield className="h-5 w-5 text-sky-400"/>{translate(" Ranked statistics")}</h3><div className="mt-4 space-y-2">{Object.keys(ranked.stats).length ? Object.entries(ranked.stats).sort(([a],[b])=>a.localeCompare(b)).map(([key,value]) => <div key={key} className="flex items-center justify-between border-b border-white/6 py-2.5"><span className="text-sm text-muted-foreground">{translate(pretty(key))}</span><b>{N(value)}</b></div>) : <p className="text-sm text-muted-foreground">{translate("No ranked statistics recorded.")}</p>}</div></div>
          </div>
        </div> : <p className="p-7 text-muted-foreground">{translate("This player has not entered ranked competition yet.")}</p>}
      </section>}

      <>
        {section === "gamebet" && <section className="surface-panel p-5 md:p-7"><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><WalletCards className="text-sky-400"/>{translate(" GameBet activity")}</h2>{player.casino ? <div className="mt-5 grid grid-cols-2 gap-3">{Object.entries(player.casino).map(([key,value]) => <div key={key} className="rounded-xl border border-white/8 bg-white/[0.02] p-3"><p className="text-xs text-muted-foreground">{translate(pretty(key))}</p><b className="mt-1 block text-lg">{N(value)}</b></div>)}</div> : <p className="mt-4 text-muted-foreground">{translate("No GameBet activity recorded.")}</p>}</section>}
        {section === "cosmetics" && <section className="surface-panel p-5 md:p-7"><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><Package className="text-sky-400"/>{translate(" Cosmetics")}</h2><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/8 p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{translate("Owned")}</p><b className="mt-1 block text-2xl">{player.cosmetics.length}</b></div><div className="rounded-xl border border-white/8 p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{translate("Active")}</p><b className="mt-1 block text-2xl">{player.activeCosmetics.length}</b></div></div><div className="mt-4 flex flex-wrap gap-2">{player.cosmetics.map((item:string) => <span key={item} className="rounded-full border border-sky-400/25 bg-sky-400/5 px-3 py-1 text-xs">{pretty(item)}</span>)}</div></section>}
      </>

      {section === "ultimate-team" && <section id="bb-collection" className="surface-panel p-5 md:p-7">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><WalletCards className="text-sky-400"/>{translate(" Ultimate Team collection")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{translate("Cards and duplicate quantities owned by this player across S1 and S2.")}</p>
        <div className="my-5 flex flex-wrap items-end gap-3"><label className="text-xs text-muted-foreground">{translate("Search cards")}<input value={cardSearch} onChange={event=>{setCardSearch(event.target.value);setCardPage(1);}} placeholder={translate("Player, position or card type")} className="mt-2 block min-h-11 w-64 max-w-full rounded-lg border border-white/15 bg-black/20 px-3 text-sm text-white"/></label><label className="text-xs text-muted-foreground">{translate("Season")}<select value={cardSeason} onChange={event=>{setCardSeason(event.target.value);setCardPage(1);}} className="mt-2 block min-h-11 rounded-lg border border-white/15 bg-[#101b20] px-3 text-sm text-white"><option value="">{translate("All seasons")}</option>{Array.from(new Set(cards.map(card=>card.seasonId))).map(season=><option key={season} value={season}>{season}</option>)}</select></label></div>
        {utQuery.isLoading ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-72 animate-pulse rounded-2xl bg-white/5"/>)}</div> : utQuery.isError ? <p className="mt-5 text-destructive">{translate("Could not load this collection.")}</p> : filteredCards.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleCards.map(card=><BlockballUltimateTeamCard key={card.id} card={card} showOwnership/>)}</div> : <p className="mt-5 text-muted-foreground">{cards.length ? translate("No cards match these filters.") : translate("This player does not own any BlockBall UT cards yet.")}</p>}
        {!utQuery.isLoading && !utQuery.isError && filteredCards.length > 0 && <div className="next-pagination"><button disabled={currentCardPage <= 1} onClick={()=>setCardPage(currentCardPage-1)}>{translate("Previous")}</button><span>{translate("Page ")}{currentCardPage}{translate(" of ")}{cardPages} · {filteredCards.length}{translate(" card types")}</span><button disabled={currentCardPage >= cardPages} onClick={()=>setCardPage(currentCardPage+1)}>{translate("Next")}</button></div>}
      </section>}

      {section === "league" && <section id="bb-league" className="surface-panel p-5 md:p-7">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><History className="text-sky-400"/>{translate(" League career")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{translate("Complete BlockBall league history across recorded seasons.")}</p>
        {player.leagueHistory?.career ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Matches",player.leagueHistory.career.matches],["Goals",player.leagueHistory.career.goals],["Assists",player.leagueHistory.career.assists],["Saves",player.leagueHistory.career.saves],["Wins",player.leagueHistory.career.wins],["Draws",player.leagueHistory.career.draws],["Losses",player.leagueHistory.career.losses],["Clean sheets",player.leagueHistory.career.cleanSheets]].map(([name,value])=><div key={name} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{translate(name)}</p><b className="mt-1 block text-2xl">{N(value)}</b></div>)}</div> : <p className="mt-5 text-muted-foreground">{translate("No finalized career statistics recorded.")}</p>}

        <div className="mt-8"><h3 className="font-display text-lg font-bold uppercase">{translate("Season by season")}</h3><div className="mt-4 space-y-3">{player.leagueHistory?.seasons?.length ? player.leagueHistory.seasons.map((item:any)=><div key={`${item.league}-${item.season}`} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><b className="text-sky-400">{item.league === "ML" ? translate("Major League") : item.league === "LL" ? translate("Lower League") : item.league}</b><span className="ml-2 text-sm text-muted-foreground">{translate("Season ")}{item.season}</span></div><span className={`rounded-full px-2.5 py-1 text-xs ${item.finalized ? "bg-white/5 text-muted-foreground" : "bg-sky-400/10 text-sky-300"}`}>{item.finalized ? translate("Past season") : translate("Current")}</span></div><div className="mt-4 grid grid-cols-4 gap-2 text-center sm:grid-cols-8">{[["MP",item.matches],["W",item.wins],["D",item.draws],["L",item.losses],["G",item.goals],["A",item.assists],["S",item.saves],["CS",item.cleanSheets]].map(([k,v])=><div key={k} className="rounded-xl border border-white/6 p-2"><p className="text-[10px] text-muted-foreground">{translate(k)}</p><b>{N(v)}</b></div>)}</div></div>) : <p className="text-muted-foreground">{translate("No seasonal history recorded.")}</p>}</div></div>

        <div className="mt-8"><h3 className="flex items-center gap-2 font-display text-lg font-bold uppercase"><Award className="h-5 w-5 text-amber-300"/>{translate(" Awards")}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{player.leagueHistory?.awards?.length ? player.leagueHistory.awards.map((item:any,index:number)=><div key={`${item.league}-${item.season}-${item.awardType}-${index}`} className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">{translate(pretty(item.awardType))}</p><p className="mt-2 font-semibold">{item.league}{translate(" · Season ")}{item.season}</p>{Number(item.amount)>1 && <p className="mt-1 text-sm text-muted-foreground">{translate("Awarded × ")}{item.amount}</p>}</div>) : <p className="text-muted-foreground">{translate("No league awards recorded.")}</p>}</div></div>
      </section>}
    </div>
  );
}
