import { Link } from "wouter";
import logoPath from "@assets/NEXTLogo2_2_1782769726637.png";
import {
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const LEAGUES = [
  {
    server: "football",
    league: "main",
    label: "Football",
    sublabel: "Main League",
    color: "#39ff14",
    bg: "from-[#39ff1415]",
  },
  {
    server: "football",
    league: "lower",
    label: "Football",
    sublabel: "Lower League",
    color: "#f97316",
    bg: "from-[#f9731615]",
  },
  {
    server: "blockball",
    league: "main",
    label: "Blockball",
    sublabel: "Main League",
    color: "#38bdf8",
    bg: "from-[#38bdf815]",
  },
  {
    server: "blockball",
    league: "lower",
    label: "Blockball",
    sublabel: "Lower League",
    color: "#f43f5e",
    bg: "from-[#f43f5e15]",
  },
] as const;

function CopyIpButton({ ip }: { ip: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ip).then(() => {
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };

  return (
    <div className="group flex w-full max-w-md items-center gap-3 rounded-xl border border-border bg-background px-5 py-4 transition-all duration-200 hover:border-[#39ff14]/50">
      <span className="flex-1 select-all font-mono text-lg text-foreground">
        {ip}
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className="rounded p-1 text-muted-foreground transition-colors hover:text-[#39ff14]"
        title="Copy IP"
        aria-label="Copy Minecraft server IP"
      >
        {copied ? (
          <Check className="h-5 w-5 text-[#39ff14]" />
        ) : (
          <Copy className="h-5 w-5" />
        )}
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
    <div className="flex flex-col gap-0 overflow-x-hidden pb-0">
      {/* Hero */}
      <section className="relative flex min-h-[85dvh] flex-col items-center justify-center overflow-hidden border-b border-border bg-background px-4 py-20 text-center">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#39ff14]/10 blur-[120px]" />

          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.025] mix-blend-overlay" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-8">
          <img
            src={logoPath}
            alt="NEXT Football"
            className="w-36 mix-blend-lighten drop-shadow-[0_0_40px_#39ff1455] md:w-52"
          />

          <div className="flex flex-col gap-3">
            <h1 className="font-display text-6xl font-bold uppercase leading-none tracking-tighter md:text-8xl lg:text-9xl">
              NEXT
              <br />

              <span className="bg-gradient-to-r from-[#39ff14] via-white to-[#39ff14] bg-clip-text text-transparent">
                FOOTBALL
              </span>
            </h1>

            <p className="mx-auto max-w-xl text-lg text-muted-foreground md:text-xl">
              High-stakes. Electric energy. Raw talent. The
              underground fast-moving football league.
            </p>
          </div>

          {/* Server info */}
          <div className="mt-2 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            {isLoading ? (
              <>
                <Skeleton className="h-14 w-64 rounded-xl" />
                <Skeleton className="h-14 w-44 rounded-xl" />
              </>
            ) : (
              <>
                <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
                  <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                    Minecraft Server IP
                  </span>

                  {settings.minecraftIp ? (
                    <CopyIpButton ip={settings.minecraftIp} />
                  ) : (
                    <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-dashed border-border bg-background px-5 py-4 opacity-40">
                      <span className="flex-1 font-mono text-lg text-muted-foreground">
                        Not configured
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
                  <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                    Community
                  </span>

                  {settings.discordUrl ? (
                    <a
                      href={settings.discordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button
                        size="lg"
                        className="flex h-14 w-full items-center gap-2 rounded-xl bg-[#5865F2] px-8 font-display text-base uppercase tracking-widest text-white hover:bg-[#4752C4] sm:w-auto"
                      >
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.12 18.1.145 18.118a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                        </svg>

                        Join Discord

                        <ExternalLink className="h-4 w-4 opacity-70" />
                      </Button>
                    </a>
                  ) : (
                    <Button
                      size="lg"
                      disabled
                      className="flex h-14 cursor-not-allowed items-center gap-2 rounded-xl bg-[#5865F2]/30 px-8 font-display text-base uppercase tracking-widest text-white/40"
                    >
                      <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.12 18.1.145 18.118a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                      </svg>

                      Join Discord
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* CTA */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/football/main">
              <Button
                size="lg"
                className="h-12 bg-[#39ff14] px-8 font-display uppercase tracking-widest text-black hover:bg-[#39ff14]/90"
              >
                Enter Football
              </Button>
            </Link>

            <Link href="/blockball/main">
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-border px-8 font-display uppercase tracking-widest hover:border-[#38bdf8] hover:text-[#38bdf8]"
              >
                Enter Blockball
              </Button>
            </Link>

            <Link href="/profile">
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 border-border px-8 font-display uppercase tracking-widest hover:border-[#39ff14] hover:text-[#39ff14]"
              >
                <UserRound className="h-4 w-4" />
                Player Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* League Cards */}
      <section className="bg-background px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-10 text-center font-display text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Choose Your League
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {LEAGUES.map(
              ({
                server,
                league,
                label,
                sublabel,
                color,
                bg,
              }) => (
                <Link
                  key={`${server}/${league}`}
                  href={`/${server}/${league}`}
                >
                  <div
                    className={`group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${bg} to-card p-6 transition-all duration-300 hover:shadow-lg`}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.borderColor = `${color}55`;
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.borderColor = "";
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                        {label}
                      </span>

                      <span className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                        {sublabel}
                      </span>

                      <div className="mt-3 flex gap-3">
                        <span
                          className="font-display text-xs uppercase tracking-widest opacity-70 transition-opacity hover:opacity-100"
                          style={{ color }}
                        >
                          Standings
                        </span>

                        <span
                          className="font-display text-xs uppercase tracking-widest opacity-70 transition-opacity hover:opacity-100"
                          style={{ color }}
                        >
                          Results
                        </span>

                        <span
                          className="font-display text-xs uppercase tracking-widest opacity-70 transition-opacity hover:opacity-100"
                          style={{ color }}
                        >
                          Fixtures
                        </span>
                      </div>
                    </div>

                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full border transition-colors"
                      style={{
                        borderColor: `${color}33`,
                        backgroundColor: `${color}11`,
                      }}
                    >
                      <ChevronRight
                        className="h-5 w-5"
                        style={{ color }}
                      />
                    </div>

                    <div
                      className="pointer-events-none absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/3 rounded-full blur-[60px]"
                      style={{
                        backgroundColor: `${color}18`,
                      }}
                    />
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>
    </div>
  );
}