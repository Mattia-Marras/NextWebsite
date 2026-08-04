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
import { getLeagueTheme } from "@/lib/league-theme";

interface LayoutProps { children: React.ReactNode; }

function parseLeagueFromPath(path: string) {
  const parts = path.split("/").filter(Boolean);
  return {
    server: parts[0] === "blockball" ? "blockball" : "football",
    league: parts[1] === "lower" ? "lower" : "main",
  };
}

const footballLinks = [
  { label: "Ranked", href: "/football/leaderboards?tab=ranked" },
  { label: "League", href: "/football/main" },
  { label: "Player search", href: "/football/players" },
  { label: "Leaderboards", href: "/football/leaderboards" },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { server, league } = parseLeagueFromPath(location);
  const theme = getLeagueTheme(server, league);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark" style={{ "--primary": theme.hsl } as React.CSSProperties}>
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <img src={logoPath} alt="NEXT Football" className="h-9 w-auto mix-blend-lighten" />
            <span className="hidden font-display text-xl font-bold uppercase tracking-wider sm:block">
              NEXT <span className="text-[#39ff14]">Football</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-display font-semibold uppercase tracking-wider text-[#39ff14]">
                  NextFootball <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-border bg-card">
                <DropdownMenuLabel className="font-display text-xs uppercase tracking-[0.2em] text-[#39ff14]">Choose section</DropdownMenuLabel>
                {footballLinks.map((item) => (
                  <DropdownMenuItem key={item.label} asChild className="cursor-pointer">
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">League division</DropdownMenuLabel>
                <DropdownMenuItem asChild><Link href="/football/main">Main League</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/football/lower">Lower League</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-display font-semibold uppercase tracking-wider text-muted-foreground">
                  Blockball <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 border-border bg-card">
                <DropdownMenuLabel className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">Coming later</DropdownMenuLabel>
                <DropdownMenuItem disabled>Ranked</DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/blockball/main">League</Link></DropdownMenuItem>
                <DropdownMenuItem disabled>Player search</DropdownMenuItem>
                <DropdownMenuItem disabled>Leaderboards</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen((open) => !open)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border bg-card px-4 py-4 md:hidden">
            <p className="mb-3 font-display text-xs uppercase tracking-[0.25em] text-[#39ff14]">NextFootball</p>
            <div className="grid gap-1">
              {footballLinks.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-card/40">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-8 text-xs uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 NEXT Football League</span>
          <Link href="/admin" className="hover:text-foreground">Admin</Link>
        </div>
      </footer>
    </div>
  );
}
