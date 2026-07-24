import { useGetStandings } from "@workspace/api-client-react";
import { TeamBadge } from "@/components/team-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useParams } from "wouter";

export function Standings() {
  const { server = "football", league = "main" } = useParams<{ server: string; league: string }>();
  const serverName = server === "blockball" ? "Blockball" : "NEXT Football";
  const leagueName = league === "lower" ? "Lower League" : "Main League";
  
  const { data: standings, isLoading } = useGetStandings({ server: server as any, league: league as any });

  const getFormBadge = (result: string, index: number) => {
    let colorClass = "bg-muted text-muted-foreground";
    if (result === 'W') colorClass = "bg-green-500/20 text-green-500 border-green-500/30";
    if (result === 'D') colorClass = "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    if (result === 'L') colorClass = "bg-red-500/20 text-red-500 border-red-500/30";

    return (
      <div 
        key={index}
        className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold border ${colorClass}`}
      >
        {result}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-wider flex items-center gap-4">
          <span className="w-4 h-10 bg-primary block rounded-sm"></span>
          League Table - {serverName} {leagueName}
        </h1>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 text-center font-display uppercase tracking-widest text-xs">Pos</TableHead>
                <TableHead className="font-display uppercase tracking-widest text-xs">Team</TableHead>
                <TableHead className="text-center font-display uppercase tracking-widest text-xs w-12">P</TableHead>
                <TableHead className="text-center font-display uppercase tracking-widest text-xs w-12 hidden sm:table-cell">W</TableHead>
                <TableHead className="text-center font-display uppercase tracking-widest text-xs w-12 hidden sm:table-cell">D</TableHead>
                <TableHead className="text-center font-display uppercase tracking-widest text-xs w-12 hidden sm:table-cell">L</TableHead>
                <TableHead className="text-center font-display uppercase tracking-widest text-xs w-16 hidden md:table-cell">GF</TableHead>
                <TableHead className="text-center font-display uppercase tracking-widest text-xs w-16 hidden md:table-cell">GA</TableHead>
                <TableHead className="text-center font-display uppercase tracking-widest text-xs w-16">GD</TableHead>
                <TableHead className="text-center font-display uppercase tracking-widest text-xs w-16 font-bold text-primary">Pts</TableHead>
                <TableHead className="text-center font-display uppercase tracking-widest text-xs w-40 hidden lg:table-cell">Form</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-24 mx-auto" /></TableCell>
                  </TableRow>
                ))
              ) : standings?.length ? (
                standings.map((row, index) => (
                  <TableRow key={row.teamId} className={`transition-colors hover:bg-muted/30 ${index < 3 ? "bg-primary/5" : ""}`}>
                    <TableCell className="text-center">
                      <span className={`font-display font-bold text-lg ${index < 3 ? "text-primary" : "text-muted-foreground"}`}>
                        {index + 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <TeamBadge team={row.team} showName size="md" />
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">{row.played}</TableCell>
                    <TableCell className="text-center font-mono text-sm text-muted-foreground hidden sm:table-cell">{row.won}</TableCell>
                    <TableCell className="text-center font-mono text-sm text-muted-foreground hidden sm:table-cell">{row.drawn}</TableCell>
                    <TableCell className="text-center font-mono text-sm text-muted-foreground hidden sm:table-cell">{row.lost}</TableCell>
                    <TableCell className="text-center font-mono text-sm text-muted-foreground hidden md:table-cell">{row.goalsFor}</TableCell>
                    <TableCell className="text-center font-mono text-sm text-muted-foreground hidden md:table-cell">{row.goalsAgainst}</TableCell>
                    <TableCell className="text-center font-mono text-sm font-medium">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</TableCell>
                    <TableCell className="text-center font-mono text-base font-bold text-primary">{row.points}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {row.form?.split('').map((char, i) => getFormBadge(char, i))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center text-muted-foreground font-display uppercase tracking-widest">
                    No standings available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}