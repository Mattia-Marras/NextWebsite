import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Copy, ExternalLink, MessageCircle, Server, Youtube } from "lucide-react";
import logoPath from "@assets/NEXTLogo2_2_1782769726637.png";
import { useGetSettings } from "@workspace/api-client-react";
import { PitchArt } from "@/components/pitch-art";
import { getRankedLeaderboard } from "@/lib/nextfb-api";
import { getBlockballRanked } from "@/lib/blockball-api";
function CopyServerIp({ ip }: { ip: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copyIp = async () => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopyError(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <button type="button" onClick={copyIp} className="group flex min-h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 text-left transition hover:border-[#39ff14]/45 hover:bg-white/[0.04]" aria-label={`Copy Minecraft server IP ${ip}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#39ff14]/25 bg-[#39ff14]/10 text-[#39ff14]"><Server className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1"><span className="block font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Join the network</span><span className="mt-0.5 block select-text truncate font-mono text-sm font-semibold text-white sm:text-base">{ip}</span></span>
      <span aria-live="polite" className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition group-hover:text-[#39ff14]">{copyError ? "Select IP to copy" : copied ? "Copied" : "Copy"}{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</span>
    </button>
  );
}

function CompetitionDesk() {
  const football = useQuery({queryKey:["network-desk-football"],queryFn:()=>getRankedLeaderboard({limit:3,offset:0})});
  const blockball = useQuery({queryKey:["network-desk-blockball"],queryFn:getBlockballRanked});
  const boards = [
<<<<<<< HEAD
    {mode:"football",name:"Football",query:football,rows:(football.data?.data ?? []).map(p=>({name:p.username?.trim() || "Player",mmr:p.mmr}))},
    {mode:"blockball",name:"BlockBall",query:blockball,rows:(blockball.data?.leaderboard ?? []).slice(0,3).map((p:any)=>({name:p.name,mmr:p.mmr}))},
  ];
  return <section className="next-desk container mx-auto px-4 py-12"><div className="next-section-heading"><div><p className="next-kicker">Ranked / Current standings</p><h2>At the top of NEXT.</h2></div><p>The current leaders in each game.</p></div><div className="grid gap-8 md:grid-cols-2">{boards.map(board=><div key={board.mode} className={`next-leader-table next-${board.mode}`}><div className="flex items-center justify-between border-b border-white/15 py-4"><h3 className="font-display text-xl font-bold uppercase">{board.name}</h3><Link href={`/${board.mode}/ranked`} className="next-text-link">Full ladder <ArrowRight size={14}/></Link></div>{board.query.isLoading ? <p role="status" className="py-8 text-sm text-muted-foreground">Loading standings…</p> : board.query.isError ? <p className="py-8 text-sm text-muted-foreground">Standings are temporarily unavailable.</p> : board.rows.length ? board.rows.map((player:{name:string;mmr:number},index:number)=><div key={index} className="next-leader-row"><span className="next-place">{String(index+1).padStart(2,"0")}</span><span className="truncate font-semibold">{player.name}</span><span className="font-mono text-sm">{new Intl.NumberFormat("en-US").format(player.mmr)} <small className="text-muted-foreground">MMR</small></span></div>) : <p className="py-8 text-sm text-muted-foreground">No Ranked standings recorded yet.</p>}</div>)}</div></section>;
=======
    {mode:"football",name:"Football",query:football,rows:(football.data?.data ?? []).map(p=>({name:p.username?.trim() || "Player",mmr:p.mmr,uuid:p.uuid}))},
    {mode:"blockball",name:"BlockBall",query:blockball,rows:(blockball.data?.leaderboard ?? []).slice(0,3).map((p:any)=>({name:p.name,mmr:p.mmr,uuid:p.uuid}))},
  ];
  return <section className="next-desk container mx-auto px-4 py-12"><div className="next-section-heading"><div><p className="next-kicker">Ranked / Current standings</p><h2>At the top of NEXT.</h2></div><p>The current leaders in each game.</p></div><div className="grid gap-8 md:grid-cols-2">{boards.map(board=><div key={board.mode} className={`next-leader-table next-${board.mode}`}><div className="flex items-center justify-between border-b border-white/15 py-4"><h3 className="font-display text-xl font-bold uppercase">{board.name}</h3><Link href={`/${board.mode}/ranked`} className="next-text-link">Full ladder <ArrowRight size={14}/></Link></div>{board.query.isLoading ? <p role="status" className="py-8 text-sm text-muted-foreground">Loading standings…</p> : board.query.isError ? <p className="py-8 text-sm text-muted-foreground">Standings are temporarily unavailable.</p> : board.rows.length ? board.rows.map((player:{name:string;mmr:number;uuid?:string},index:number)=><div key={index} className="next-leader-row"><span className="next-place">{String(index+1).padStart(2,"0")}</span><span className="truncate font-semibold">{player.uuid ? <Link className="hover:underline underline-offset-4" href={`/${board.mode}/profile/${encodeURIComponent(player.uuid)}`}>{player.name}</Link> : player.name}</span><span className="font-mono text-sm">{new Intl.NumberFormat("en-US").format(player.mmr)} <small className="text-muted-foreground">MMR</small></span></div>) : <p className="py-8 text-sm text-muted-foreground">No Ranked standings recorded yet.</p>}</div>)}</div></section>;
>>>>>>> 5f078c1 (New website rewwork)
}

export function Landing() {
  const { data: settings } = useGetSettings();
  const ip = settings?.minecraftIp || "play.nextfootball.net";
  const discord = settings?.discordUrl || "https://discord.gg/QEtx8dSBQr";
  const youtube = settings?.youtubeUrl || "https://www.youtube.com/@NEXTFootballOfficial";
  return <div className="next-editorial page-reveal">
    <section className="next-network-hero container mx-auto px-4">
      <div className="next-hero-copy"><p className="next-kicker">NEXT / Minecraft Football Network</p><h1>MINECRAFT.<br/>MATCHDAY.</h1><p className="next-hero-description">Football and BlockBall. Ranked matches, official leagues and the players behind them.</p><div className="mt-7 max-w-md"><CopyServerIp ip={ip}/></div><div className="mt-4 flex flex-wrap gap-5"><a className="next-text-link" href={discord} target="_blank" rel="noopener noreferrer"><MessageCircle size={15}/> Join Discord <ExternalLink size={12}/></a><a className="next-text-link" href={youtube} target="_blank" rel="noopener noreferrer"><Youtube size={15}/> Watch NEXT <ExternalLink size={12}/></a></div></div>
      <div className="next-brand-board"><div className="next-board-caption"><span>THE NEXT PITCH</span><span>FOOTBALL / BLOCKBALL</span></div><img src={logoPath} alt="NEXT" className="next-board-logo"/><PitchArt/><div className="next-board-footer"><span>Minecraft football</span><span>Ranked · League · UT</span></div></div>
    </section>
    <section className="container mx-auto px-4 py-10"><div className="next-section-heading"><div><p className="next-kicker">The games</p><h2>Pick your pitch.</h2></div></div><div className="next-game-grid">
      <Link href="/football" className="next-game-entry next-football group"><div className="next-game-meta"><span>NEXT FOOTBALL</span><ArrowRight className="transition-transform group-hover:translate-x-1"/></div><h3>FOOTBALL</h3><p>Follow the league table.<br/>Take your place on the Ranked ladder.</p><div className="next-game-bottom"><span>Ranked / Major & Lower League</span><b>Enter Football →</b></div><PitchArt/></Link>
      <Link href="/blockball" className="next-game-entry next-blockball group"><div className="next-game-meta"><span>NEXT BLOCKBALL</span><ArrowRight className="transition-transform group-hover:translate-x-1"/></div><h3>BLOCK<br/>BALL</h3><p>Compete in Ranked and League.<br/>Explore the Ultimate Team collection.</p><div className="next-game-bottom"><span>Ranked / League / Ultimate Team</span><b>Enter BlockBall →</b></div><PitchArt blockball/></Link>
    </div></section>
    <CompetitionDesk/>
    <section className="container mx-auto px-4 pb-16"><div className="next-community"><div><p className="next-kicker">Off the pitch</p><h2>Find your teammates.</h2><p>Ask the community about joining, follow announcements and meet other players on Discord.</p></div><a href={discord} target="_blank" rel="noopener noreferrer" className="next-solid-link">Join the community <ArrowRight size={18}/></a></div></section>
  </div>;
}
