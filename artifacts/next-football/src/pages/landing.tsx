
import { Link } from "wouter";
import logoPath from "@assets/NEXTLogo2_2_1782769726637.png";
import { Copy, Check, ExternalLink, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const LEAGUES = [
  { server: "football", league: "main", label: "Football", sublabel: "Main League", color: "#39ff14", bg: "from-[#39ff1415]" },
  { server: "football", league: "lower", label: "Football", sublabel: "Lower League", color: "#f97316", bg: "from-[#f9731615]" },
  { server: "blockball", league: "main", label: "Blockball", sublabel: "Main League", color: "#38bdf8", bg: "from-[#38bdf815]" },
  { server: "blockball", league: "lower", label: "Blockball", sublabel: "Lower League", color: "#f43f5e", bg: "from-[#f43f5e15]" },
] as const;

function CopyIpButton({ ip }: { ip: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(ip).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-5 py-4 group hover:border-[#39ff14]/50 transition-all duration-200 max-w-md w-full">
      <span className="font-mono text-lg text-foreground flex-1 select-all">{ip}</span>
      <button
        onClick={handleCopy}
        className="text-muted-foreground hover:text-[#39ff14] transition-colors p-1 rounded"
        title="Copy IP"
      >
        {copied ? <Check className="w-5 h-5 text-[#39ff14]" /> : <Copy className="w-5 h-5" />}
      </button>
    </div>
  );
}

export function Landing() {
const settings = {
  minecraftIp: "play.nextfootball.net",
  discordUrl: "https://discord.gg/5Z4fU8fumt",
};

const isLoading = false;

  return (
    <div className="flex flex-col gap-0 pb-0 overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[85dvh] flex flex-col items-center justify-center overflow-hidden bg-background border-b border-border text-center px-4 py-20">
        {/* Radial glow */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[120px] bg-[#39ff14]/10" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.025] mix-blend-overlay" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 max-w-4xl mx-auto">
          <img
            src={logoPath}
            alt="NEXT Football"
            className="w-36 md:w-52 mix-blend-lighten drop-shadow-[0_0_40px_#39ff1455]"
          />

          <div className="flex flex-col gap-3">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold uppercase tracking-tighter leading-none">
              NEXT<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39ff14] via-white to-[#39ff14]">
                FOOTBALL
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              High-stakes. Electric energy. Raw talent. The underground fast-moving football league.
            </p>
          </div>

          {/* Server info — always visible */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2 w-full">
            {isLoading ? (
              <>
                <Skeleton className="h-14 w-64 rounded-xl" />
                <Skeleton className="h-14 w-44 rounded-xl" />
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-display uppercase tracking-widest text-muted-foreground">Minecraft Server IP</span>
                  {settings?.minecraftIp ? (
                    <CopyIpButton ip={settings.minecraftIp} />
                  ) : (
                    <div className="flex items-center gap-3 bg-background border border-dashed border-border rounded-xl px-5 py-4 max-w-md w-full opacity-40">
                      <span className="font-mono text-lg text-muted-foreground flex-1">Not configured</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-display uppercase tracking-widest text-muted-foreground">Community</span>
                  {settings?.discordUrl ? (
                    <a href={settings.discordUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto font-display uppercase tracking-widest px-8 h-14 text-base bg-[#5865F2] hover:bg-[#4752C4] text-white flex items-center gap-2 rounded-xl">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.12 18.1.145 18.118a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                        </svg>
                        Join Discord
                        <ExternalLink className="w-4 h-4 opacity-70" />
                      </Button>
                    </a>
                  ) : (
                    <Button size="lg" disabled className="font-display uppercase tracking-widest px-8 h-14 text-base bg-[#5865F2]/30 text-white/40 flex items-center gap-2 rounded-xl cursor-not-allowed">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.12 18.1.145 18.118a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                      </svg>
                      Join Discord
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Link href="/football/main">
              <Button size="lg" className="font-display uppercase tracking-widest px-8 h-12 text-black bg-[#39ff14] hover:bg-[#39ff14]/90">
                Enter Football
              </Button>
            </Link>
            <Link href="/blockball/main">
              <Button size="lg" variant="outline" className="font-display uppercase tracking-widest px-8 h-12 border-border hover:border-[#38bdf8] hover:text-[#38bdf8]">
                Enter Blockball
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* League Cards */}
      <section className="bg-background py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-center text-xs font-display uppercase tracking-[0.4em] text-muted-foreground mb-10">Choose Your League</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LEAGUES.map(({ server, league, label, sublabel, color, bg }) => (
              <Link key={`${server}/${league}`} href={`/${server}/${league}`}>
                <div
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${bg} to-card border border-border hover:border-[${color}]/50 transition-all duration-300 p-6 flex items-center justify-between cursor-pointer hover:shadow-lg`}
                  style={{ borderColor: "inherit" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}55`)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "")}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-display uppercase tracking-widest text-muted-foreground">{label}</span>
                    <span className="text-2xl font-display font-bold uppercase tracking-tight text-foreground">{sublabel}</span>
                    <div className="flex gap-3 mt-3">
                      <span className="text-xs font-display uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity" style={{ color }}>Standings</span>
                      <span className="text-xs font-display uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity" style={{ color }}>Results</span>
                      <span className="text-xs font-display uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity" style={{ color }}>Fixtures</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border transition-colors" style={{ borderColor: `${color}33`, backgroundColor: `${color}11` }}>
                    <ChevronRight className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none" style={{ backgroundColor: `${color}18` }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
