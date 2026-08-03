import { Link, useLocation } from "wouter";
import logoPath from "@assets/NEXTLogo2_2_1782769726637.png";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLeagueTheme } from "@/lib/league-theme";

interface LayoutProps {
  children: React.ReactNode;
}

function parseLeagueFromPath(path: string): { server: string; league: string } {
  const parts = path.split("/").filter(Boolean);
  const server = parts[0] ?? "football";
  const league = parts[1] ?? "main";
  return { server, league };
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { server, league } = parseLeagueFromPath(location);
  const theme = getLeagueTheme(server, league);

  const getIsActive = (s: string) => location.startsWith(`/${s}`);

  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-background text-foreground dark"
      style={{ "--primary": theme.hsl } as React.CSSProperties}
    >
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={logoPath} alt="NEXT Football" className="h-10 w-auto mix-blend-lighten" />
            <span className="font-display font-bold text-2xl uppercase tracking-wider hidden sm:block">
              NEXT <span className="text-primary">Football</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`font-display font-semibold uppercase tracking-wider ${getIsActive("football") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"}`}>
                  Football <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                <DropdownMenuLabel className="font-display uppercase tracking-widest text-xs" style={{ color: getLeagueTheme("football", "main").hex }}>
                  Main League
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/football/main">Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/football/main/results">Results</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/football/main/fixtures">Fixtures</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/football/main/standings">Standings</Link></DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuLabel className="font-display uppercase tracking-widest text-xs" style={{ color: getLeagueTheme("football", "lower").hex }}>
                  Lower League
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/football/lower">Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/football/lower/results">Results</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/football/lower/fixtures">Fixtures</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/football/lower/standings">Standings</Link></DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuLabel className="font-display uppercase tracking-widest text-xs text-[#39ff14]">
                  NextFootball
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/football/players">Player Profiles</Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`font-display font-semibold uppercase tracking-wider ${getIsActive("blockball") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary"}`}>
                  Blockball <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                <DropdownMenuLabel className="font-display uppercase tracking-widest text-xs" style={{ color: getLeagueTheme("blockball", "main").hex }}>
                  Main League
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/blockball/main">Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/blockball/main/results">Results</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/blockball/main/fixtures">Fixtures</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/blockball/main/standings">Standings</Link></DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuLabel className="font-display uppercase tracking-widest text-xs" style={{ color: getLeagueTheme("blockball", "lower").hex }}>
                  Lower League
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/blockball/lower">Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/blockball/lower/results">Results</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/blockball/lower/fixtures">Fixtures</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer"><Link href="/blockball/lower/standings">Standings</Link></DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground hover:text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="font-display font-bold uppercase tracking-widest text-sm mb-1" style={{ color: getLeagueTheme("football", "main").hex }}>Football — Main League</div>
              <div className="pl-4 flex flex-col gap-2">
                {["", "/results", "/fixtures", "/standings"].map((p) => (
                  <Link key={p} href={`/football/main${p}`} onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-primary transition-colors">
                    {p === "" ? "Dashboard" : p.slice(1).charAt(0).toUpperCase() + p.slice(2)}
                  </Link>
                ))}
              </div>
              <div className="font-display font-bold uppercase tracking-widest text-sm mb-1 mt-2" style={{ color: getLeagueTheme("football", "lower").hex }}>Football — Lower League</div>
              <div className="pl-4 flex flex-col gap-2">
                {["", "/results", "/fixtures", "/standings"].map((p) => (
                  <Link key={p} href={`/football/lower${p}`} onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-primary transition-colors">
                    {p === "" ? "Dashboard" : p.slice(1).charAt(0).toUpperCase() + p.slice(2)}
                  </Link>
                ))}
              </div>

              <div className="mt-3 border-t border-border/50 pt-3">
                <div className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-[#39ff14]">
                  NextFootball
                </div>
                <div className="flex flex-col gap-2 pl-4">
                  <Link
                    href="/football/players"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-muted-foreground transition-colors hover:text-[#39ff14]"
                  >
                    Player Profiles
                  </Link>
                </div>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex flex-col gap-2">
              <div className="font-display font-bold uppercase tracking-widest text-sm mb-1" style={{ color: getLeagueTheme("blockball", "main").hex }}>Blockball — Main League</div>
              <div className="pl-4 flex flex-col gap-2">
                {["", "/results", "/fixtures", "/standings"].map((p) => (
                  <Link key={p} href={`/blockball/main${p}`} onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-primary transition-colors">
                    {p === "" ? "Dashboard" : p.slice(1).charAt(0).toUpperCase() + p.slice(2)}
                  </Link>
                ))}
              </div>
              <div className="font-display font-bold uppercase tracking-widest text-sm mb-1 mt-2" style={{ color: getLeagueTheme("blockball", "lower").hex }}>Blockball — Lower League</div>
              <div className="pl-4 flex flex-col gap-2">
                {["", "/results", "/fixtures", "/standings"].map((p) => (
                  <Link key={p} href={`/blockball/lower${p}`} onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-primary transition-colors">
                    {p === "" ? "Dashboard" : p.slice(1).charAt(0).toUpperCase() + p.slice(2)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border bg-card py-8 mt-12">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex flex-col items-start gap-2">
            <img src={logoPath} alt="NEXT Football" className="h-8 w-auto mix-blend-lighten opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
            <p className="text-muted-foreground text-sm font-display uppercase tracking-widest">
              © {new Date().getFullYear()} NEXT Football League. All rights reserved.
            </p>
          </div>
          <Link href="/admin" data-testid="link-admin-footer">
            <Button variant="outline" size="sm" className="font-display uppercase tracking-widest text-xs text-muted-foreground border-border hover:text-primary hover:border-primary">
              Admin
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
