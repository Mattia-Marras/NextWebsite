import { Team } from "@workspace/api-client-react";

interface TeamBadgeProps {
  team: Team;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  className?: string;
}

export function TeamBadge({ team, size = "md", showName = false, className = "" }: TeamBadgeProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-display font-bold text-white shadow-sm ring-1 ring-white/10 shrink-0 overflow-hidden bg-muted`}
        style={!team.logoUrl ? { 
          background: `linear-gradient(135deg, ${team.primaryColor || '#333'} 0%, ${team.secondaryColor || '#111'} 100%)`
        } : {}}
        title={team.name}
      >
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
        ) : (
          team.logoInitials
        )}
      </div>
      {showName && (
        <span className="font-display font-semibold tracking-wide truncate">
          {team.shortName || team.name}
        </span>
      )}
    </div>
  );
}
