import { SectionNav } from "@/components/section-nav";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Award, CalendarDays, Goal, History, Shield, Target, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { getBlockballLeague, type BBLeague } from "@/lib/blockball-api";
import { Button } from "@/components/ui/button";

const formatDate = (value: string) => { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date) : "Date unavailable"; };
const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

export function BlockballHome() {
  const { league = "main", section: requestedSection = "overview" } = useParams<{ league: string; section?: string }>();
  const sections = [["overview","Overview"],["standings","Standings"],["results","Results"],["players","Player stats"],["archive","Season archive"],["awards","Awards"]] as const;
  const section = sections.some(([key]) => key === requestedSection) ? requestedSection : "overview";
  const base = `/blockball/${league === "lower" ? "lower" : "main"}`;
  const [resultSearch, setResultSearch] = useState("");
  const [resultPage, setResultPage] = useState(1);
  const code: BBLeague = league === "lower" ? "LL" : "ML";
  const [season, setSeason] = useState("");
  const selectedSeason = section === "archive" || section === "awards" ? season : "";
  const query = useQuery({ queryKey: ["blockball", code, selectedSeason], queryFn: () => getBlockballLeague(code, selectedSeason || undefined) });
  const data = query.data;
  const history = data?.history;
  const results = (data?.matches ?? []).filter((match: any) => `${match.team1} ${match.team2}`.toLowerCase().includes(resultSearch.trim().toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(results.length / 12));
  const currentPage = Math.min(resultPage, pageCount);
  const visibleResults = section === "overview" ? (data?.matches ?? []).slice(0, 3) : results.slice((currentPage - 1) * 12, currentPage * 12);

  return (
    <div className="next-editorial next-player next-blockball container mx-auto space-y-8 px-4 py-10">
      <section className="relative overflow-hidden next-player-header border border-white/15 p-7 md:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="font-display text-xs font-semibold uppercase tracking-[0.32em] text-sky-400">NEXT BlockBall League</p><h1 className="mt-3 font-display text-4xl font-bold uppercase md:text-6xl">{code === "ML" ? "Major League" : "Lower League"}</h1><p className="mt-3 max-w-2xl text-muted-foreground">Standings, match results and player records for the league.</p></div>
          <div className="flex gap-2 rounded-2xl border border-white/8 bg-black/20 p-1.5"><Link onClick={() => {setSeason("");setResultPage(1);}} href={section === "overview" ? "/blockball/main" : `/blockball/main/${section}`}><Button variant={code === "ML" ? "default" : "ghost"}>Major League</Button></Link><Link onClick={() => {setSeason("");setResultPage(1);}} href={section === "overview" ? "/blockball/lower" : `/blockball/lower/${section}`}><Button variant={code === "LL" ? "default" : "ghost"}>Lower League</Button></Link></div>
        </div>
      </section>

      <SectionNav base={base} active={section} items={sections} label="League sections" />
      {query.isLoading ? <p>Loading league data...</p> : query.isError || !data ? <div className="surface-panel p-6"><p className="text-muted-foreground">League data is currently unavailable.</p><button onClick={() => query.refetch()} className="mt-4 text-sky-400">Try again →</button></div> : <>
        {(section === "archive" || section === "awards") && <div className="flex justify-end">{history.seasons.length > 0 && <select aria-label="Select league season" value={history.selectedSeason || ""} onChange={e=>setSeason(e.target.value)} className="rounded-xl border border-white/10 bg-[#0b1017] px-4 py-2.5 text-sm"><option value="">Latest season</option>{history.seasons.map((s:any)=><option key={s.seasonId} value={s.seasonId}>{s.seasonId} · {s.finalized ? "Past season" : "Current"}</option>)}</select>}</div>}
        {(section === "overview" || section === "standings") && <section className="surface-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/8 p-5 md:p-7"><div><h2 className="font-display text-2xl font-bold uppercase">League standings</h2><p className="mt-1 text-sm text-muted-foreground">Live table including registered results and manual adjustments.</p></div><Trophy className="h-7 w-7 text-sky-400" /></div>
          <div className="overflow-x-auto"><div className="min-w-[820px]"><div className="grid grid-cols-[70px_1fr_repeat(8,65px)] border-b border-white/8 bg-white/[0.025] px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span>Pos</span><span>Club</span>{["P","W","D","L","GF","GA","GD","Pts"].map(x => <span className="text-center" key={x}>{x}</span>)}</div>{data.standings.map((row:any) => <div key={row.teamId} className="grid grid-cols-[70px_1fr_repeat(8,65px)] items-center border-b border-white/6 px-6 py-4 transition hover:bg-white/[0.035]"><b className={row.position <= 3 ? "text-sky-400" : ""}>{row.position}</b><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/8 text-xs font-bold text-sky-300">{row.teamCode || row.teamName.slice(0,3).toUpperCase()}</span><b>{row.teamName}</b></div>{[row.played,row.won,row.drawn,row.lost,row.goalsFor,row.goalsAgainst,row.goalDifference,row.points].map((v:any,i:number)=><span key={i} className={`text-center ${i===7?"font-bold text-white":"text-muted-foreground"}`}>{v}</span>)}</div>)}</div></div>
        </section>}

        <>
          {(section === "overview" || section === "results") && <section className="surface-panel p-5 md:p-7"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-2xl font-bold uppercase">{section === "results" ? "Match results" : "Latest results"}</h2><p className="mt-1 text-sm text-muted-foreground">Most recently recorded league matches.</p></div><CalendarDays className="text-sky-400" /></div>{section === "results" && <label className="mb-5 block text-xs text-muted-foreground">Filter results by club<input value={resultSearch} onChange={event=>{setResultSearch(event.target.value);setResultPage(1);}} className="mt-2 block min-h-11 w-full max-w-md rounded-lg border border-white/15 bg-black/20 px-3 text-sm text-white" placeholder="Club name"/></label>}<div className="space-y-3">{visibleResults.length ? visibleResults.map((match:any)=><div key={match.id} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.02] p-4"><div><p className="break-words font-semibold">{match.team1}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(match.playedAt)}</p></div><div className="rounded-xl border border-sky-400/20 bg-sky-400/8 px-4 py-2 text-lg font-bold">{match.score1} <span className="text-muted-foreground">–</span> {match.score2}</div><div className="text-right"><p className="break-words font-semibold">{match.team2}</p><p className="mt-1 text-xs text-muted-foreground">{match.matchday ? `Matchday ${match.matchday}` : "League match"}</p></div></div>) : <p className="text-muted-foreground">{resultSearch ? "No results match this club." : "No results have been recorded yet."}</p>}</div>{section === "overview" ? <Link href={`${base}/results`} className="mt-5 inline-block text-sm font-semibold text-sky-400">All results →</Link> : <div className="next-pagination"><button disabled={currentPage <= 1} onClick={()=>setResultPage(currentPage-1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage >= pageCount} onClick={()=>setResultPage(currentPage+1)}>Next</button></div>}</section>}
          {section === "players" && <section className="surface-panel p-5 md:p-7"><h2 className="font-display text-2xl font-bold uppercase">Performance leaders</h2><p className="mt-1 text-sm text-muted-foreground">Top current-season contributions.</p><div className="mt-6 space-y-6">{[["Goals",Goal,"goals"],["Assists",Target,"assists"],["Saves",Shield,"saves"]].map(([name,Icon,key]:any)=><div key={key}><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em]"><Icon className="h-4 w-4 text-sky-400"/>{name}</h3>{data.leaders[key].map((p:any,i:number)=><div key={p.uuid} className="flex items-center justify-between border-b border-white/6 py-2.5"><Link href={`/blockball/profile/${p.uuid}`} className="hover:text-sky-400"><span className="mr-2 text-muted-foreground">{i+1}</span>{p.name}</Link><b>{p[key]}</b></div>)}</div>)}</div></section>}
        </>

        {section === "archive" && <section className="surface-panel p-5 md:p-7">
          <div className="flex flex-col gap-4 border-b border-white/8 pb-5 md:flex-row md:items-end md:justify-between"><div><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><History className="text-sky-400"/> Season archive</h2><p className="mt-1 text-sm text-muted-foreground">Browse player records from previous seasons.</p></div></div>
          {!history.selectedSeason ? <p className="pt-5 text-muted-foreground">No archived seasons found.</p> : <div className="pt-6">
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[Users,"Players",history.players.length],[Goal,"Goals",history.players.reduce((a:number,p:any)=>a+Number(p.goals||0),0)],[Target,"Assists",history.players.reduce((a:number,p:any)=>a+Number(p.assists||0),0)],[Shield,"Saves",history.players.reduce((a:number,p:any)=>a+Number(p.saves||0),0)]].map(([Icon,n,v]:any)=><div key={n} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"><Icon className="h-5 w-5 text-sky-400"/><p className="mt-3 text-xs uppercase tracking-[0.12em] text-muted-foreground">{n}</p><b className="mt-1 block text-2xl">{v}</b></div>)}</div>
            <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-sm"><thead><tr className="border-b border-white/8 text-left text-xs uppercase tracking-[0.1em] text-muted-foreground"><th className="py-3">Player</th>{["MP","W","D","L","G","A","S","CS"].map(x=><th key={x} className="px-3 py-3 text-center">{x}</th>)}</tr></thead><tbody>{history.players.map((p:any)=><tr key={p.uuid} className="border-b border-white/6"><td className="py-3"><Link href={`/blockball/profile/${p.uuid}`} className="font-semibold hover:text-sky-400">{p.name}</Link></td>{[p.matches,p.wins,p.draws,p.losses,p.goals,p.assists,p.saves,p.cleanSheets].map((v:any,i:number)=><td key={i} className="px-3 py-3 text-center text-muted-foreground">{v}</td>)}</tr>)}</tbody></table></div>
          </div>}
        </section>}

        {section === "awards" && <section className="surface-panel p-5 md:p-7"><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><Award className="text-sky-400"/> Season awards</h2><p className="mt-1 text-sm text-muted-foreground">Official recognitions for {history.selectedSeason || "the selected season"}.</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{history.awards.length ? history.awards.map((a:any)=><div key={`${a.id}-${a.uuid}`} className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">{label(a.awardType)}</p><Link href={`/blockball/profile/${a.uuid}`} className="mt-2 block text-lg font-bold hover:text-sky-400">{a.name}</Link>{Number(a.amount)>1 && <p className="mt-1 text-sm text-muted-foreground">× {a.amount}</p>}</div>) : <p className="text-muted-foreground">No awards recorded for this season.</p>}</div></section>}
      </>}
    </div>
  );
}
