import { Match } from "@workspace/api-client-react";
import { TeamBadge } from "./team-badge";
import { formatDateTime } from "@/lib/format";
import { Badge } from "./ui/badge";
import { formatTeamName } from "@/lib/team-display";

interface MatchCardProps {
  match: Match;
  variant?: "default" | "compact";
}

export function MatchCard({ match, variant = "default" }: MatchCardProps) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  
  return (
    <div className={`group relative bg-card border border-border rounded-lg overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(57,255,20,0.1)] flex flex-col ${variant === "compact" ? "p-3" : "p-4 sm:p-5"}`}>
      {/* Background glow for live matches */}
      {isLive && (
        <div className="absolute inset-0 bg-destructive/5 animate-pulse pointer-events-none" />
      )}
      
      <div className="flex justify-between items-center mb-4 text-xs font-display tracking-widest text-muted-foreground relative z-10">
        <span className="uppercase">{match.round}</span>
        {isLive ? (
          <Badge variant="destructive" className="animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.5)]">LIVE</Badge>
        ) : isFinished ? (
          <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">FT</Badge>
        ) : (
          <Badge variant="secondary" className="bg-secondary/50">{formatDateTime(match.matchDate)}</Badge>
        )}
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1 flex flex-col items-center gap-2">
          <TeamBadge team={match.homeTeam} size={variant === "compact" ? "lg" : "xl"} />
          <span className="font-display font-semibold text-center text-sm md:text-base line-clamp-2 min-h-10 w-full leading-tight">{formatTeamName(match.homeTeam.shortName || match.homeTeam.name)}</span>
        </div>

        <div className="flex-[0.5] flex justify-center items-center px-2">
          {(isFinished || isLive) ? (
            <div className="flex items-center gap-2 md:gap-3 text-2xl md:text-4xl font-display font-bold">
              <span className={match.homeScore! > match.awayScore! ? "text-foreground" : "text-muted-foreground"}>{match.homeScore}</span>
              <span className="text-muted-foreground/50 text-xl">-</span>
              <span className={match.awayScore! > match.homeScore! ? "text-foreground" : "text-muted-foreground"}>{match.awayScore}</span>
            </div>
          ) : (
            <div className="text-xl md:text-2xl font-display font-bold text-muted-foreground/30">VS</div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center gap-2">
          <TeamBadge team={match.awayTeam} size={variant === "compact" ? "lg" : "xl"} />
          <span className="font-display font-semibold text-center text-sm md:text-base line-clamp-2 min-h-10 w-full leading-tight">{formatTeamName(match.awayTeam.shortName || match.awayTeam.name)}</span>
        </div>
      </div>

      {variant !== "compact" && match.venue && (
        <div className="mt-4 pt-4 border-t border-border/50 text-center text-xs text-muted-foreground font-display uppercase tracking-widest relative z-10">
          {match.venue}
        </div>
      )}
    </div>
  );
}
