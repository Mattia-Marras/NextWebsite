import { Link } from "wouter";
import { ArrowRight, Search, Trophy, Users, Swords } from "lucide-react";
import logoPath from "@assets/NEXTLogo2_2_1782769726637.png";

const sections = [
  { title: "Ranked", description: "MMR, competitive ranks and the strongest players.", href: "/football/leaderboards?tab=ranked", icon: Swords },
  { title: "League", description: "Standings, upcoming fixtures and recent results in one place.", href: "/football/main", icon: Trophy },
  { title: "Player search", description: "Find any registered NextFootball player and open the full profile.", href: "/football/players", icon: Search },
  { title: "Leaderboards", description: "Compare level, coins, goals, assists, saves and ranked MMR.", href: "/football/leaderboards", icon: Users },
];

export function Landing() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#39ff14]/10 blur-[150px]" />
      <section className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <img src={logoPath} alt="NEXT Football" className="mx-auto h-24 w-auto mix-blend-lighten md:h-32" />
          <p className="mt-6 font-display text-xs uppercase tracking-[0.4em] text-[#39ff14]">Official platform</p>
          <h1 className="mt-4 font-display text-5xl font-bold uppercase tracking-tight md:text-7xl">Everything about<br /><span className="text-[#39ff14]">NEXT Football</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">Choose what you need immediately. Blockball remains available from the top menu, but today this area is focused entirely on NEXT Football.</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
          {sections.map(({ title, description, href, icon: Icon }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-border bg-card/70 p-6 transition hover:-translate-y-1 hover:border-[#39ff14]/40 hover:bg-card">
              <div className="flex items-start justify-between gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#39ff14]/25 bg-[#39ff14]/10 text-[#39ff14]"><Icon className="h-6 w-6" /></div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-[#39ff14]" />
              </div>
              <h2 className="mt-8 font-display text-2xl font-bold uppercase tracking-wide">{title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
