import { useListMatches } from "@workspace/api-client-react";
import { MatchCard } from "@/components/match-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "wouter";

export function Fixtures() {
  const { server = "football", league = "main" } = useParams<{ server: string; league: string }>();
  const serverName = server === "blockball" ? "Blockball" : "NEXT Football";
  const leagueName = league === "lower" ? "Lower League" : "Main League";
  
  const { data: matches, isLoading } = useListMatches({ status: "scheduled", server: server as any, league: league as any });

  // Group by round
  const groupedMatches = matches?.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<string, typeof matches>) || {};

  const rounds = Object.keys(groupedMatches).sort((a, b) => {
    return a.localeCompare(b);
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-wider flex items-center gap-4">
          <span className="w-4 h-10 bg-muted-foreground block rounded-sm"></span>
          Fixtures - {serverName} {leagueName}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl font-sans">
          Upcoming matches and schedule.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-12">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : rounds.length > 0 ? (
        <div className="space-y-16">
          {rounds.map((round) => (
            <div key={round} className="space-y-6">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground">{round}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedMatches[round].map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center border border-dashed border-border rounded-xl bg-card">
          <p className="text-muted-foreground font-display text-lg uppercase tracking-wider">No upcoming fixtures scheduled.</p>
        </div>
      )}
    </div>
  );
}