import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";

import {
  getNextFootballLeague,
  type LeagueTeamStanding,
} from "@/lib/nextfb-api";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/*
 * Associazione temporanea tra gli slug usati negli URL
 * e gli ID reali delle leghe nel database NextFootball.
 *
 * Verifica che:
 * - Main League abbia realmente ID 1
 * - Lower League abbia realmente ID 2
 */
const NEXT_FOOTBALL_LEAGUE_IDS: Record<string, number> = {
  main: 1,
  lower: 2,
};

function getLeagueId(
  server: string,
  league: string,
): number | null {
  /*
   * Per ora questa pagina è collegata soltanto
   * al database NextFootball.
   *
   * NextBlockBall verrà collegato separatamente.
   */
  if (server !== "football") {
    return null;
  }

  return NEXT_FOOTBALL_LEAGUE_IDS[league] ?? null;
}

function formatGoalDifference(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function getPositionStyle(position: number): string {
  if (position <= 3) {
    return "text-primary";
  }

  return "text-muted-foreground";
}

function StandingRow({
  row,
}: {
  row: LeagueTeamStanding;
}) {
  return (
    <TableRow
      className={[
        "transition-colors hover:bg-muted/30",
        row.position <= 3 ? "bg-primary/5" : "",
      ].join(" ")}
    >
      <TableCell className="text-center">
        <span
          className={[
            "font-display text-lg font-bold",
            getPositionStyle(row.position),
          ].join(" ")}
        >
          {row.position}
        </span>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 font-display text-sm font-bold uppercase text-foreground">
            {row.teamName.slice(0, 2)}
          </div>

          <span className="font-display font-semibold uppercase tracking-wide">
            {row.teamName}
          </span>
        </div>
      </TableCell>

      <TableCell className="text-center font-mono text-sm">
        {row.played}
      </TableCell>

      <TableCell className="hidden text-center font-mono text-sm text-muted-foreground sm:table-cell">
        {row.won}
      </TableCell>

      <TableCell className="hidden text-center font-mono text-sm text-muted-foreground sm:table-cell">
        {row.drawn}
      </TableCell>

      <TableCell className="hidden text-center font-mono text-sm text-muted-foreground sm:table-cell">
        {row.lost}
      </TableCell>

      <TableCell className="hidden text-center font-mono text-sm text-muted-foreground md:table-cell">
        {row.goalsFor}
      </TableCell>

      <TableCell className="hidden text-center font-mono text-sm text-muted-foreground md:table-cell">
        {row.goalsAgainst}
      </TableCell>

      <TableCell className="text-center font-mono text-sm font-medium">
        {formatGoalDifference(row.goalDifference)}
      </TableCell>

      <TableCell className="text-center font-mono text-base font-bold text-primary">
        {row.points}
      </TableCell>
    </TableRow>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="mx-auto h-6 w-6" />
          </TableCell>

          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-6 w-40" />
            </div>
          </TableCell>

          <TableCell>
            <Skeleton className="mx-auto h-6 w-6" />
          </TableCell>

          <TableCell className="hidden sm:table-cell">
            <Skeleton className="mx-auto h-6 w-6" />
          </TableCell>

          <TableCell className="hidden sm:table-cell">
            <Skeleton className="mx-auto h-6 w-6" />
          </TableCell>

          <TableCell className="hidden sm:table-cell">
            <Skeleton className="mx-auto h-6 w-6" />
          </TableCell>

          <TableCell className="hidden md:table-cell">
            <Skeleton className="mx-auto h-6 w-6" />
          </TableCell>

          <TableCell className="hidden md:table-cell">
            <Skeleton className="mx-auto h-6 w-6" />
          </TableCell>

          <TableCell>
            <Skeleton className="mx-auto h-6 w-8" />
          </TableCell>

          <TableCell>
            <Skeleton className="mx-auto h-6 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function Standings() {
  const {
    server = "football",
    league = "main",
  } = useParams<{
    server: string;
    league: string;
  }>();

  const leagueId = getLeagueId(server, league);

  const serverName =
    server === "blockball"
      ? "Blockball"
      : "NEXT Football";

  const fallbackLeagueName =
    league === "lower"
      ? "Lower League"
      : "Main League";

  const {
    data: leagueData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "nextfb",
      "league",
      leagueId,
      "standings",
    ],

    queryFn: () => {
      if (leagueId === null) {
        throw new Error(
          "This league is not connected to the NextFootball database.",
        );
      }

      return getNextFootballLeague(leagueId);
    },

    enabled: leagueId !== null,
  });

  const standings = leagueData?.standings ?? [];

  const displayedLeagueName =
    leagueData?.name ?? fallbackLeagueName;

  const unsupportedServer = leagueId === null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="flex items-center gap-4 font-display text-4xl font-bold uppercase tracking-wider md:text-5xl">
          <span className="block h-10 w-4 rounded-sm bg-primary" />

          League Table — {serverName}{" "}
          {displayedLeagueName}
        </h1>

        {leagueData && (
          <p className="mt-4 text-sm text-muted-foreground">
            {leagueData.playerCount} registered players
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 text-center font-display text-xs uppercase tracking-widest">
                  Pos
                </TableHead>

                <TableHead className="font-display text-xs uppercase tracking-widest">
                  Team
                </TableHead>

                <TableHead className="w-12 text-center font-display text-xs uppercase tracking-widest">
                  P
                </TableHead>

                <TableHead className="hidden w-12 text-center font-display text-xs uppercase tracking-widest sm:table-cell">
                  W
                </TableHead>

                <TableHead className="hidden w-12 text-center font-display text-xs uppercase tracking-widest sm:table-cell">
                  D
                </TableHead>

                <TableHead className="hidden w-12 text-center font-display text-xs uppercase tracking-widest sm:table-cell">
                  L
                </TableHead>

                <TableHead className="hidden w-16 text-center font-display text-xs uppercase tracking-widest md:table-cell">
                  GF
                </TableHead>

                <TableHead className="hidden w-16 text-center font-display text-xs uppercase tracking-widest md:table-cell">
                  GA
                </TableHead>

                <TableHead className="w-16 text-center font-display text-xs uppercase tracking-widest">
                  GD
                </TableHead>

                <TableHead className="w-16 text-center font-display text-xs font-bold uppercase tracking-widest text-primary">
                  Pts
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <LoadingRows />
              ) : unsupportedServer ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-40 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-display text-lg uppercase tracking-widest text-foreground">
                        Blockball not connected yet
                      </span>

                      <span className="max-w-lg text-sm text-muted-foreground">
                        This page currently reads only from
                        the NextFootball database.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-40 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-display text-lg uppercase tracking-widest text-destructive">
                        Unable to load standings
                      </span>

                      <span className="max-w-lg text-sm text-muted-foreground">
                        {error instanceof Error
                          ? error.message
                          : "An unexpected error occurred."}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : standings.length > 0 ? (
                standings.map((row) => (
                  <StandingRow
                    key={`${row.position}-${row.teamName}`}
                    row={row}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-40 text-center font-display uppercase tracking-widest text-muted-foreground"
                  >
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
