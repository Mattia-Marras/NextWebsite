import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Activity, Coins, Crown, Package, Shield, Swords, Trophy, WalletCards } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getBlockballPlayer } from "@/lib/blockball-api";

const N = (value: unknown) => new Intl.NumberFormat("en-US").format(Number(value) || 0);
const pretty = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function BlockballProfile() {
  const { uuid = "" } = useParams<{ uuid: string }>();
  const query = useQuery({ queryKey: ["bb-player", uuid], queryFn: () => getBlockballPlayer(uuid) });
  if (query.isLoading) return <div className="container mx-auto p-10">Loading player profile...</div>;
  if (query.isError) return <div className="container mx-auto p-10 text-destructive">BlockBall player not found.</div>;

  const player = query.data;
  const ranked = player.ranked;
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
    <div className="container mx-auto space-y-7 px-4 py-10">
      <Link href="/blockball/players" className="text-sm font-semibold text-sky-400 hover:text-sky-300">← Find another player</Link>

      <section className="relative overflow-hidden rounded-[28px] border border-sky-400/20 bg-gradient-to-br from-sky-400/12 via-white/[0.035] to-transparent p-7 md:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">NEXT BlockBall Player Profile</p>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase md:text-6xl">{player.name}</h1>
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">Offline UUID · {player.uuid}</p>
          </div>
          {ranked && <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current competitive rank</p><p className="mt-1 text-2xl font-bold text-sky-400">{ranked.rank.displayName}</p><p className="text-sm">{N(ranked.mmr)} MMR</p></div>}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[[Crown,"Account level",player.level],[Trophy,"Experience",N(player.xp)],[Coins,"Coin balance",N(player.coins)]].map(([Icon,label,value]: any) => <div key={label} className="surface-panel p-5"><Icon className="h-6 w-6 text-sky-400"/><p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p><b className="mt-1 block text-3xl">{value}</b></div>)}
      </div>

      <section className="surface-panel overflow-hidden">
        <div className="border-b border-white/8 p-5 md:p-7"><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><Swords className="text-sky-400"/> Ranked performance</h2><p className="mt-1 text-sm text-muted-foreground">Complete competitive record and progression.</p></div>
        {ranked ? <div className="p-5 md:p-7">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[["MMR",N(ranked.mmr)],["Wins",N(ranked.wins)],["Losses",N(ranked.losses)],["Matches",N(games)],["Win rate",`${winRate.toFixed(1)}%`]].map(([label,value]) => <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <h3 className="flex items-center gap-2 font-semibold"><Activity className="h-5 w-5 text-sky-400"/> MMR progression</h3>
              <div className="mt-4 h-[300px]">
                {history.length > 1 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={history} margin={{top:8,right:15,left:0,bottom:8}}><CartesianGrid strokeDasharray="3 3" opacity={0.12}/><XAxis dataKey="label" tick={{fontSize:11}}/><YAxis domain={["dataMin - 50","dataMax + 50"]} tick={{fontSize:11}}/><Tooltip contentStyle={{background:"#0b1017",border:"1px solid rgba(255,255,255,.1)",borderRadius:12}}/><Line type="monotone" dataKey="mmr" stroke="currentColor" className="text-sky-400" strokeWidth={3} dot={{r:3}} activeDot={{r:5}}/></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">At least two MMR history records are required to display progression.</div>}
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5"><h3 className="flex items-center gap-2 font-semibold"><Shield className="h-5 w-5 text-sky-400"/> Ranked statistics</h3><div className="mt-4 space-y-2">{Object.keys(ranked.stats).length ? Object.entries(ranked.stats).sort(([a],[b])=>a.localeCompare(b)).map(([key,value]) => <div key={key} className="flex items-center justify-between border-b border-white/6 py-2.5"><span className="text-sm text-muted-foreground">{pretty(key)}</span><b>{N(value)}</b></div>) : <p className="text-sm text-muted-foreground">No ranked statistics recorded.</p>}</div></div>
          </div>
        </div> : <p className="p-7 text-muted-foreground">This player has not entered ranked competition yet.</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel p-5 md:p-7"><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><WalletCards className="text-sky-400"/> Casino activity</h2>{player.casino ? <div className="mt-5 grid grid-cols-2 gap-3">{Object.entries(player.casino).map(([key,value]) => <div key={key} className="rounded-xl border border-white/8 bg-white/[0.02] p-3"><p className="text-xs text-muted-foreground">{pretty(key)}</p><b className="mt-1 block text-lg">{N(value)}</b></div>)}</div> : <p className="mt-4 text-muted-foreground">No casino activity recorded.</p>}</section>
        <section className="surface-panel p-5 md:p-7"><h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><Package className="text-sky-400"/> Cosmetics</h2><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/8 p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Owned</p><b className="mt-1 block text-2xl">{player.cosmetics.length}</b></div><div className="rounded-xl border border-white/8 p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Active</p><b className="mt-1 block text-2xl">{player.activeCosmetics.length}</b></div></div><div className="mt-4 flex flex-wrap gap-2">{player.cosmetics.map((item:string) => <span key={item} className="rounded-full border border-sky-400/25 bg-sky-400/5 px-3 py-1 text-xs">{item}</span>)}</div></section>
      </div>

      <section className="surface-panel p-5 md:p-7"><h2 className="font-display text-2xl font-bold uppercase">League statistics</h2><p className="mt-1 text-sm text-muted-foreground">Official Major League and Lower League contributions.</p><div className="mt-5 space-y-3">{player.leagueStats.length ? player.leagueStats.map((item:any) => <div key={item.league} className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:grid-cols-4"><b className="text-sky-400">{item.league === "ML" ? "Major League" : "Lower League"}</b><span>{item.goals} goals</span><span>{item.assists} assists</span><span>{item.saves} saves</span></div>) : <p className="text-muted-foreground">No league statistics recorded.</p>}</div></section>
    </div>
  );
}
