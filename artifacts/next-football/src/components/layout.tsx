import { Link, useLocation } from "wouter";
import logoPath from "@assets/NEXTLogo2_2_1782769726637.png";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GAME_MODES, getGameModeFromPath } from "@/lib/game-modes";
import { getLeagueTheme } from "@/lib/league-theme";

interface LayoutProps { children: React.ReactNode; }

function parseLeagueFromPath(path: string) {
  const parts = path.split("/").filter(Boolean);
  return {
    server: parts[0] === "blockball" ? "blockball" : "football",
    league: parts[1] === "lower" ? "lower" : "main",
  };
}

function isSectionActive(location: string, href: string, label: string) {
  if (label === "Ranked") return location.includes("/leaderboards") && window.location.search.includes("tab=ranked");
  if (label === "Leaderboards") return location.includes("/leaderboards") && !window.location.search.includes("tab=ranked");
  if (label === "League") return /^\/(football|blockball)\/(main|lower)/.test(location);
  return location.startsWith(href);
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { server, league } = parseLeagueFromPath(location);
  const theme = getLeagueTheme(server, league);
  const activeMode = getGameModeFromPath(location);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark" style={{ "--primary": theme.hsl } as React.CSSProperties}>
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#090d13]/92 backdrop-blur-2xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <img src={logoPath} alt="NEXT" className="h-9 w-auto mix-blend-lighten" />
            <span className="hidden font-display text-xl font-bold uppercase tracking-[0.08em] sm:block">
              NEXT <span className="text-[#39ff14]">Football</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {GAME_MODES.map((mode) => (
              <Link
                key={mode.id}
                href={mode.available ? mode.landingHref : "/"}
                className={`rounded-xl border px-4 py-2 font-display text-sm font-semibold uppercase tracking-[0.1em] transition ${
                  activeMode.id === mode.id && location !== "/"
                    ? "border-white/12 bg-white/8 text-white"
                    : "border-transparent text-muted-foreground hover:border-white/8 hover:bg-white/5 hover:text-white"
                }`}
                style={activeMode.id === mode.id && location !== "/" ? { boxShadow: `inset 0 -2px 0 ${mode.accent}` } : undefined}
              >
                {mode.shortName}
              </Link>
            ))}
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Toggle navigation">
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {location !== "/" && (
          <div className="border-t border-white/6 bg-black/10">
            <div className="container mx-auto hidden h-12 items-center justify-center gap-1 px-4 md:flex">
              {activeMode.sections.map((section) => {
                const Icon = section.icon;
                const active = section.available && isSectionActive(location, section.href, section.label);
                return section.available ? (
                  <Link
                    key={section.label}
                    href={section.href}
                    className={`flex h-full items-center gap-2 border-b-2 px-5 font-display text-sm font-semibold uppercase tracking-[0.08em] transition ${active ? "text-white" : "border-transparent text-muted-foreground hover:text-white"}`}
                    style={active ? { borderBottomColor: activeMode.accent, color: activeMode.accent } : undefined}
                  >
                    <Icon className="h-4 w-4" /> {section.label}
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        )}

        {mobileMenuOpen && (
          <div className="border-t border-white/8 bg-[#0b1017] px-4 py-4 md:hidden">
            <p className="mb-2 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">Game mode</p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {GAME_MODES.map((mode) => (
                <Link key={mode.id} href={mode.available ? mode.landingHref : "/"} onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-white/8 bg-white/4 px-3 py-3 font-display text-sm font-semibold uppercase">
                  {mode.shortName}
                </Link>
              ))}
            </div>
            {location !== "/" && <>
              <p className="mb-2 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">Sections</p>
              <div className="grid gap-1">
                {activeMode.sections.filter((section) => section.available).map((section) => (
                  <Link key={section.label} href={section.href} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-white">
                    {section.label}
                  </Link>
                ))}
              </div>
            </>}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/8 bg-[#090d13]">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-7 text-xs uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 NEXT Competitive Network</span>
          <Link href="/admin" className="transition hover:text-white">Admin</Link>
        </div>
      </footer>
    </div>
  );
}
