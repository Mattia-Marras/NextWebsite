import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Coins,
  Crown,
  Goal,
  LoaderCircle,
  Medal,
  Shield,
  Target,
  Trophy,
  UserRound,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  type CasinoLeaderboardEntry,
  type PaginatedResult,
  type PlayerBaseProfile,
  type PlayerLeaderboardEntry,
  type RankedLeaderboardEntry,
  getCasinoLeaderboard,
  getCoinsLeaderboard,
  getLevelLeaderboard,
  getPlayerStatLeaderboard,
  getRankedLeaderboard,
} from "@/lib/nextfb-api";

const FOOTBALL_ACCENT = "#39ff14";
const PAGE_SIZE = 25;

type LeaderboardType =
  | "level"
  | "coins"
  | "ranked"
  | "goals"
  | "assists"
  | "saves"
  | "casino";

interface MinecraftIdentity {
  username?: string | null;
}

type PlayerBaseProfileWithUsername =
  PlayerBaseProfile & MinecraftIdentity;

type PlayerLeaderboardEntryWithUsername =
  PlayerLeaderboardEntry & MinecraftIdentity;

type RankedLeaderboardEntryWithUsername =
  RankedLeaderboardEntry & MinecraftIdentity;

type CasinoLeaderboardEntryWithUsername =
  CasinoLeaderboardEntry & MinecraftIdentity;

type LeaderboardApiEntry =
  | PlayerBaseProfileWithUsername
  | PlayerLeaderboardEntryWithUsername
  | RankedLeaderboardEntryWithUsername
  | CasinoLeaderboardEntryWithUsername;

interface LeaderboardRow {
  position: number;
  uuid: string;
  username: string | null;
  primaryValue: number;
  secondaryLabel?: string;
  secondaryValue?: number | string;
  badge?: string;
}

const LEADERBOARD_OPTIONS: Array<{
  id: LeaderboardType;
  label: string;
  description: string;
}> = [
  {
    id: "level",
    label: "Level",
    description:
      "Players with the highest NextFootball level.",
  },
  {
    id: "coins",
    label: "Coins",
    description:
      "Players with the largest coin balance.",
  },
  {
    id: "ranked",
    label: "Ranked",
    description:
      "Competitive players ordered by ranked MMR.",
  },
  {
    id: "goals",
    label: "Goals",
    description:
      "Players with the most goals in Classic mode.",
  },
  {
    id: "assists",
    label: "Assists",
    description:
      "Players with the most assists in Classic mode.",
  },
  {
    id: "saves",
    label: "Saves",
    description:
      "Players with the most saves in Classic mode.",
  },
  {
    id: "casino",
    label: "Casino",
    description:
      "Players with the highest lifetime casino winnings.",
  },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function shortenUuid(uuid: string): string {
  if (uuid.length <= 20) {
    return uuid;
  }

  return `${uuid.slice(0, 8)}...${uuid.slice(-8)}`;
}

function normalizeUsername(
  username: string | null | undefined,
): string | null {
  if (
    typeof username !== "string" ||
    username.trim() === ""
  ) {
    return null;
  }

  return username.trim();
}

function getLeaderboardIcon(type: LeaderboardType) {
  switch (type) {
    case "level":
      return <Crown className="h-6 w-6" />;

    case "coins":
      return <Coins className="h-6 w-6" />;

    case "ranked":
      return <Trophy className="h-6 w-6" />;

    case "goals":
      return <Goal className="h-6 w-6" />;

    case "assists":
      return <Target className="h-6 w-6" />;

    case "saves":
      return <Shield className="h-6 w-6" />;

    case "casino":
      return <WalletCards className="h-6 w-6" />;
  }
}

function getPrimaryValueLabel(
  type: LeaderboardType,
): string {
  switch (type) {
    case "level":
      return "Level";

    case "coins":
      return "Coins";

    case "ranked":
      return "MMR";

    case "goals":
      return "Goals";

    case "assists":
      return "Assists";

    case "saves":
      return "Saves";

    case "casino":
      return "Total won";
  }
}

async function loadLeaderboard(
  type: LeaderboardType,
  offset: number,
): Promise<PaginatedResult<LeaderboardApiEntry>> {
  const pagination = {
    limit: PAGE_SIZE,
    offset,
  };

  switch (type) {
    case "level":
      return getLevelLeaderboard(
        pagination,
      ) as Promise<
        PaginatedResult<PlayerBaseProfileWithUsername>
      >;

    case "coins":
      return getCoinsLeaderboard(
        pagination,
      ) as Promise<
        PaginatedResult<PlayerBaseProfileWithUsername>
      >;

    case "ranked":
      return getRankedLeaderboard(
        pagination,
      ) as Promise<
        PaginatedResult<RankedLeaderboardEntryWithUsername>
      >;

    case "goals":
      return getPlayerStatLeaderboard(
        "DEFAULT",
        "GOALS",
        pagination,
      ) as Promise<
        PaginatedResult<PlayerLeaderboardEntryWithUsername>
      >;

    case "assists":
      return getPlayerStatLeaderboard(
        "DEFAULT",
        "ASSISTS",
        pagination,
      ) as Promise<
        PaginatedResult<PlayerLeaderboardEntryWithUsername>
      >;

    case "saves":
      return getPlayerStatLeaderboard(
        "DEFAULT",
        "SAVES",
        pagination,
      ) as Promise<
        PaginatedResult<PlayerLeaderboardEntryWithUsername>
      >;

    case "casino":
      return getCasinoLeaderboard(
        "totalWon",
        pagination,
      ) as Promise<
        PaginatedResult<CasinoLeaderboardEntryWithUsername>
      >;
  }
}

function createRows(
  type: LeaderboardType,
  result: PaginatedResult<LeaderboardApiEntry>,
): LeaderboardRow[] {
  return result.data.map((entry, index) => {
    const fallbackPosition =
      result.offset + index + 1;

    if (type === "level") {
      const player =
        entry as PlayerBaseProfileWithUsername;

      return {
        position: fallbackPosition,
        uuid: player.uuid,
        username: normalizeUsername(player.username),
        primaryValue: player.level,
        secondaryLabel: "XP",
        secondaryValue: player.xp,
      };
    }

    if (type === "coins") {
      const player =
        entry as PlayerBaseProfileWithUsername;

      return {
        position: fallbackPosition,
        uuid: player.uuid,
        username: normalizeUsername(player.username),
        primaryValue: player.coins,
        secondaryLabel: "Level",
        secondaryValue: player.level,
      };
    }

    if (type === "ranked") {
      const player =
        entry as RankedLeaderboardEntryWithUsername;

      return {
        position:
          player.position ?? fallbackPosition,
        uuid: player.uuid,
        username: normalizeUsername(player.username),
        primaryValue: player.mmr,
        secondaryLabel: "Record",
        secondaryValue: `${player.wins}W · ${player.losses}L`,
        badge: player.rank.displayWithDivision,
      };
    }

    if (
      type === "goals" ||
      type === "assists" ||
      type === "saves"
    ) {
      const player =
        entry as PlayerLeaderboardEntryWithUsername;

      return {
        position:
          player.position ?? fallbackPosition,
        uuid: player.uuid,
        username: normalizeUsername(player.username),
        primaryValue: player.value,
        secondaryLabel: "Mode",
        secondaryValue: "Classic",
      };
    }

    const player =
      entry as CasinoLeaderboardEntryWithUsername;

    return {
      position:
        player.position ?? fallbackPosition,
      uuid: player.uuid,
      username: normalizeUsername(player.username),
      primaryValue: player.totalWon,
      secondaryLabel: "Net",
      secondaryValue:
        player.totalNet > 0
          ? `+${formatNumber(player.totalNet)}`
          : formatNumber(player.totalNet),
    };
  });
}

function getPositionStyle(position: number): {
  label: string;
  className: string;
} {
  if (position === 1) {
    return {
      label: "#1",
      className:
        "border-amber-400/40 bg-amber-400/10 text-amber-400",
    };
  }

  if (position === 2) {
    return {
      label: "#2",
      className:
        "border-slate-300/40 bg-slate-300/10 text-slate-300",
    };
  }

  if (position === 3) {
    return {
      label: "#3",
      className:
        "border-orange-500/40 bg-orange-500/10 text-orange-400",
    };
  }

  return {
    label: `#${position}`,
    className:
      "border-border bg-background text-muted-foreground",
  };
}

export function FootballLeaderboards() {
  const [activeLeaderboard, setActiveLeaderboard] =
    useState<LeaderboardType>("level");

  const [page, setPage] = useState(0);

  const offset = page * PAGE_SIZE;

  const leaderboardQuery = useQuery({
    queryKey: [
      "nextfootball-leaderboard",
      activeLeaderboard,
      page,
    ],
    queryFn: () =>
      loadLeaderboard(activeLeaderboard, offset),
  });

  const currentOption =
    LEADERBOARD_OPTIONS.find(
      (option) =>
        option.id === activeLeaderboard,
    ) ?? LEADERBOARD_OPTIONS[0];

  const rows = useMemo(() => {
    if (!leaderboardQuery.data) {
      return [];
    }

    return createRows(
      activeLeaderboard,
      leaderboardQuery.data,
    );
  }, [
    activeLeaderboard,
    leaderboardQuery.data,
  ]);

  const total =
    leaderboardQuery.data?.total ?? 0;

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE),
  );

  const canGoBack = page > 0;

  const canGoForward =
    leaderboardQuery.data !== undefined &&
    offset +
      leaderboardQuery.data.data.length <
      total;

  function changeLeaderboard(
    value: string,
  ): void {
    setActiveLeaderboard(
      value as LeaderboardType,
    );
    setPage(0);
  }

  return (
    <div className="flex flex-col pb-16">
      <section className="relative overflow-hidden border-b border-border bg-background px-4 py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#39ff14]/10 blur-[150px]" />

          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.025] mix-blend-overlay" />
        </div>

        <div className="container relative z-10 mx-auto">
          <Link
            href="/football/main"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[#39ff14]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to NextFootball
          </Link>

          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="font-display uppercase tracking-[0.2em]"
                  style={{
                    color: FOOTBALL_ACCENT,
                    borderColor: `${FOOTBALL_ACCENT}55`,
                    backgroundColor: `${FOOTBALL_ACCENT}12`,
                  }}
                >
                  NextFootball
                </Badge>

                <Badge
                  variant="secondary"
                  className="font-display uppercase tracking-[0.15em]"
                >
                  Player Rankings
                </Badge>
              </div>

              <h1 className="font-display text-4xl font-bold uppercase tracking-tight md:text-6xl">
                Football Leaderboards
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Compare the strongest NextFootball
                players across progression, competitive
                performance and gameplay statistics.
              </p>
            </div>

            <Link href="/football/players">
              <Button
                variant="outline"
                className="gap-2 border-[#39ff14]/30 font-display uppercase tracking-widest hover:border-[#39ff14] hover:text-[#39ff14]"
              >
                <UserRound className="h-4 w-4" />
                Find player
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 pt-10">
        <Tabs
          value={activeLeaderboard}
          onValueChange={changeLeaderboard}
          className="w-full"
        >
          <div className="overflow-x-auto pb-2">
            <TabsList className="h-auto min-w-max justify-start gap-1 bg-card p-1">
              {LEADERBOARD_OPTIONS.map(
                (option) => (
                  <TabsTrigger
                    key={option.id}
                    value={option.id}
                    className="font-display uppercase tracking-wider"
                  >
                    {option.label}
                  </TabsTrigger>
                ),
              )}
            </TabsList>
          </div>
        </Tabs>

        <Card className="mt-8 overflow-hidden border-border bg-card/70">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    color: FOOTBALL_ACCENT,
                    borderColor: `${FOOTBALL_ACCENT}45`,
                    backgroundColor: `${FOOTBALL_ACCENT}10`,
                  }}
                >
                  {getLeaderboardIcon(
                    activeLeaderboard,
                  )}
                </div>

                <div>
                  <CardTitle className="font-display text-2xl uppercase tracking-wider">
                    {currentOption.label}
                  </CardTitle>

                  <CardDescription className="mt-1">
                    {currentOption.description}
                  </CardDescription>
                </div>
              </div>

              {!leaderboardQuery.isLoading &&
                !leaderboardQuery.isError && (
                  <Badge variant="outline">
                    {formatNumber(total)} players
                  </Badge>
                )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {leaderboardQuery.isLoading ? (
              <LeaderboardLoading />
            ) : leaderboardQuery.isError ? (
              <LeaderboardError
                onRetry={() =>
                  leaderboardQuery.refetch()
                }
              />
            ) : rows.length === 0 ? (
              <EmptyLeaderboard />
            ) : (
              <div className="divide-y divide-border">
                {rows.map((row) => (
                  <LeaderboardEntry
                    key={`${activeLeaderboard}-${row.position}-${row.uuid}`}
                    row={row}
                    valueLabel={getPrimaryValueLabel(
                      activeLeaderboard,
                    )}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!leaderboardQuery.isLoading &&
          !leaderboardQuery.isError &&
          total > 0 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  disabled={!canGoBack}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        0,
                        current - 1,
                      ),
                    )
                  }
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <Button
                  variant="outline"
                  disabled={!canGoForward}
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1,
                    )
                  }
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}

function LeaderboardEntry({
  row,
  valueLabel,
}: {
  row: LeaderboardRow;
  valueLabel: string;
}) {
  const positionStyle =
    getPositionStyle(row.position);

  const displayName =
    row.username ?? shortenUuid(row.uuid);

  return (
    <Link
      href={`/football/profile/${encodeURIComponent(
        row.uuid,
      )}`}
      className="group block"
    >
      <div className="grid min-h-24 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 py-5 transition-colors hover:bg-[#39ff14]/5 sm:px-6">
        <div
          className={`flex h-12 min-w-12 items-center justify-center rounded-xl border px-3 font-display font-bold ${positionStyle.className}`}
        >
          {row.position <= 3 ? (
            <div className="flex items-center gap-1">
              <Medal className="h-4 w-4" />
              {positionStyle.label}
            </div>
          ) : (
            positionStyle.label
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="truncate font-display text-base font-semibold text-foreground transition-colors group-hover:text-[#39ff14]"
              title={
                row.username ??
                row.uuid
              }
            >
              {displayName}
            </p>

            {row.badge && (
              <Badge
                variant="outline"
                className="hidden sm:inline-flex"
                style={{
                  color: FOOTBALL_ACCENT,
                  borderColor: `${FOOTBALL_ACCENT}44`,
                }}
              >
                {row.badge}
              </Badge>
            )}
          </div>

          {row.username && (
            <p
              className="mt-1 truncate font-mono text-xs text-muted-foreground"
              title={row.uuid}
            >
              {shortenUuid(row.uuid)}
            </p>
          )}

          {row.secondaryLabel &&
            row.secondaryValue !==
              undefined && (
              <p className="mt-1 text-xs text-muted-foreground">
                {row.secondaryLabel}:{" "}
                {typeof row.secondaryValue ===
                "number"
                  ? formatNumber(
                      row.secondaryValue,
                    )
                  : row.secondaryValue}
              </p>
            )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
              {valueLabel}
            </p>

            <p className="mt-1 font-display text-xl font-bold sm:text-2xl">
              {formatNumber(
                row.primaryValue,
              )}
            </p>
          </div>

          <ArrowRight className="hidden h-5 w-5 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-[#39ff14] sm:block" />
        </div>
      </div>
    </Link>
  );
}

function LeaderboardLoading() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 10 }).map(
        (_, index) => (
          <div
            key={index}
            className="grid min-h-24 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 py-5 sm:px-6"
          >
            <Skeleton className="h-12 w-14 rounded-xl" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-24" />
            </div>

            <div className="space-y-2">
              <Skeleton className="ml-auto h-3 w-14" />
              <Skeleton className="ml-auto h-7 w-20" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function LeaderboardError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <Trophy className="h-8 w-8 text-destructive" />
      </div>

      <h2 className="font-display text-2xl font-bold uppercase">
        Unable to load leaderboard
      </h2>

      <p className="mt-3 max-w-md text-muted-foreground">
        The NextFootball leaderboard could not be
        loaded. Please retry the request.
      </p>

      <Button
        onClick={onRetry}
        className="mt-7 gap-2"
      >
        <LoaderCircle className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

function EmptyLeaderboard() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#39ff14]/10">
        <Trophy className="h-8 w-8 text-[#39ff14]" />
      </div>

      <h2 className="font-display text-2xl font-bold uppercase">
        No players found
      </h2>

      <p className="mt-3 max-w-md text-muted-foreground">
        There are currently no players available for
        this NextFootball leaderboard.
      </p>
    </div>
  );
}