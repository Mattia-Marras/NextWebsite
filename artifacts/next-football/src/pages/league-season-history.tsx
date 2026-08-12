import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  BarChart3,
  Gift,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "wouter";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeagueTheme } from "@/lib/league-theme";
import {
  getNextFootballLeagueSeason,
  type HistoricalStatLine,
  type LeagueCode,
  type LeagueSeasonPlayer,
} from "@/lib/nextfb-api";

type SortKey =
  | "goals"
  | "assists"
  | "saves"
  | "matches"
  | "passes"
  | "shotsOnNet"
  | "cleanSheets"
  | "wins"
  | "draws"
  | "losses";

const SORTS: Array<{
  key: SortKey;
  label: string;
}> = [
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "saves", label: "Saves" },
  { key: "matches", label: "Matches" },
  { key: "passes", label: "Passes" },
  { key: "shotsOnNet", label: "Shots" },
  { key: "cleanSheets", label: "Clean sheets" },
  { key: "wins", label: "Wins" },
  { key: "draws", label: "Draws" },
  { key: "losses", label: "Losses" },
];

function pretty(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ")
    .replace("Ballon Dor", "Ballon d'Or")
    .replace("Tots", "TOTS")
    .replace("Totw", "TOTW")
    .replace("Motm", "MOTM");
}

function playerName(
  username: string | null,
  uuid: string,
) {
  return username?.trim() || "Unknown player";
}

export function LeagueSeasonHistory() {
  const {
    league = "main",
    season = "",
  } = useParams<{
    league: string;
    season: string;
  }>();

  const leagueCode: LeagueCode =
    league === "lower" ? "LL" : "ML";

  const leagueName =
    leagueCode === "LL"
      ? "Lower League"
      : "Main League";

  const theme = getLeagueTheme(
    "football",
    leagueCode === "LL"
      ? "lower"
      : "main",
  );

  const [sortKey, setSortKey] =
    useState<SortKey>("goals");

  const query = useQuery({
    queryKey: [
      "nextfb",
      "league-season",
      leagueCode,
      season,
    ],
    queryFn: () =>
      getNextFootballLeagueSeason(
        leagueCode,
        season,
      ),
    enabled: Boolean(season),
  });

  const sortedPlayers = useMemo(() => {
    const players = [
      ...(query.data?.players ?? []),
    ];

    return players.sort((a, b) => {
      const primary =
        b[sortKey] - a[sortKey];

      if (primary !== 0) {
        return primary;
      }

      if (b.goals !== a.goals) {
        return b.goals - a.goals;
      }

      if (b.assists !== a.assists) {
        return b.assists - a.assists;
      }

      return playerName(
        a.username,
        a.playerUuid,
      ).localeCompare(
        playerName(
          b.username,
          b.playerUuid,
        ),
      );
    });
  }, [query.data?.players, sortKey]);

  const groupedAwards = useMemo(() => {
    const groups =
      new Map<
        string,
        NonNullable<
          typeof query.data
        >["awards"]
      >();

    for (
      const award of
      query.data?.awards ?? []
    ) {
      const list =
        groups.get(award.awardType) ?? [];

      list.push(award);

      groups.set(
        award.awardType,
        list,
      );
    }

    return [...groups.entries()].sort(
      ([a], [b]) =>
        a.localeCompare(b),
    );
  }, [query.data?.awards]);

  if (query.isLoading) {
    return (
      <main className="container mx-auto space-y-5 px-4 py-10">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (
    query.isError ||
    !query.data
  ) {
    return (
      <main className="container mx-auto px-4 py-14">
        <div className="surface-panel p-8 text-center">
          <h1 className="font-display text-3xl font-bold uppercase">
            Season unavailable
          </h1>

          <p className="mt-3 text-muted-foreground">
            This finalized season could
            not be loaded.
          </p>

          <Link
            href={`/football/${
              leagueCode === "LL"
                ? "lower"
                : "main"
            }`}
          >
            <Button className="mt-6">
              Back to league
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const data = query.data;

  return (
    <div className="pb-16">
      <section className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <Link
            href={`/football/${
              leagueCode === "LL"
                ? "lower"
                : "main"
            }`}
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {leagueName}
          </Link>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p
                className="font-display text-xs uppercase tracking-[0.3em]"
                style={{
                  color: theme.hex,
                }}
              >
                {leagueName} archive
              </p>

              <h1 className="mt-2 font-display text-4xl font-bold uppercase md:text-5xl">
                Season {data.season}
              </h1>

              <p className="mt-3 text-muted-foreground">
                Finalized historical
                season ·{" "}
                {data.players.length}{" "}
                players · {leagueCode}
              </p>
            </div>

            <span className="w-fit rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5" />
              Finalized
            </span>
          </div>
        </div>
      </section>

      <main className="container mx-auto space-y-7 px-4 pt-7">
        <section className="surface-panel p-5 md:p-6">
          <div className="mb-5">
            <p className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Season overview
            </p>

            <h2 className="mt-1 font-display text-2xl font-bold uppercase">
              Totals
            </h2>
          </div>

          <SeasonTotals
            stats={data.totals}
          />
        </section>

        <section className="surface-panel p-5 md:p-6">
          <div className="mb-6 flex items-center gap-3">
            <Award
              className="h-5 w-5"
              style={{
                color: theme.hex,
              }}
            />

            <div>
              <p className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Official recognition
              </p>

              <h2 className="font-display text-2xl font-bold uppercase">
                Awards
              </h2>
            </div>
          </div>

          {groupedAwards.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groupedAwards.map(
                ([type, awards]) => (
                  <div
                    key={type}
                    className="rounded-2xl border border-white/8 bg-white/[0.02] p-4"
                  >
                    <p
                      className="font-display text-sm font-bold uppercase"
                      style={{
                        color:
                          theme.hex,
                      }}
                    >
                      {pretty(type)}
                    </p>

                    <div className="mt-3 space-y-2">
                      {[...awards]
                        .sort(
                          (a, b) =>
                            b.amount -
                              a.amount ||
                            playerName(
                              a.username,
                              a.playerUuid,
                            ).localeCompare(
                              playerName(
                                b.username,
                                b.playerUuid,
                              ),
                            ),
                        )
                        .map(
                          (award) => (
                            <Link
                              key={
                                award.id
                              }
                              href={`/football/profile/${award.playerUuid}`}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/6 px-3 py-2 hover:bg-white/[0.04]"
                            >
                              <span className="font-semibold">
                                {playerName(
                                  award.username,
                                  award.playerUuid,
                                )}
                              </span>

                              {award.amount >
                              1 ? (
                                <span className="text-xs text-muted-foreground">
                                  ×
                                  {
                                    award.amount
                                  }
                                </span>
                              ) : null}
                            </Link>
                          ),
                        )}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No awards recorded for
              this season.
            </p>
          )}
        </section>

        <section className="surface-panel p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-center gap-3">
              <BarChart3
                className="h-5 w-5"
                style={{
                  color:
                    theme.hex,
                }}
              />

              <div>
                <p className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  All players
                </p>

                <h2 className="font-display text-2xl font-bold uppercase">
                  Season statistics
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {SORTS.map(
                (sort) => (
                  <Button
                    key={sort.key}
                    size="sm"
                    variant={
                      sortKey ===
                      sort.key
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setSortKey(
                        sort.key,
                      )
                    }
                  >
                    {sort.label}
                  </Button>
                ),
              )}
            </div>
          </div>

          <PlayerTable
            players={sortedPlayers}
            sortKey={sortKey}
            accent={theme.hex}
          />
        </section>

        {data.rewards.length ? (
          <section className="surface-panel p-5 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Gift
                className="h-5 w-5"
                style={{
                  color:
                    theme.hex,
                }}
              />

              <div>
                <p className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Season rewards
                </p>

                <h2 className="font-display text-2xl font-bold uppercase">
                  Rewards
                </h2>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.rewards.map(
                (reward) => (
                  <Link
                    href={`/football/profile/${reward.playerUuid}`}
                    key={reward.id}
                    className="rounded-xl border border-white/8 p-4 hover:bg-white/[0.03]"
                  >
                    <div className="flex justify-between gap-3">
                      <b>
                        {playerName(
                          reward.username,
                          reward.playerUuid,
                        )}
                      </b>

                      <span className="text-sm">
                        ×
                        {
                          reward.amount
                        }
                      </span>
                    </div>

                    <p
                      className="mt-1 text-sm"
                      style={{
                        color:
                          theme.hex,
                      }}
                    >
                      {pretty(
                        reward.rewardType,
                      )}
                    </p>

                    {reward.details ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {
                          reward.details
                        }
                      </p>
                    ) : null}
                  </Link>
                ),
              )}
            </div>
          </section>
        ) : null}

        {data.cards.length ? (
          <section className="surface-panel p-5 md:p-6">
            <div className="mb-5">
              <p className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                League Cards
              </p>

              <h2 className="font-display text-2xl font-bold uppercase">
                Season cards
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.cards.map(
                (card) => {
                  const goalkeeper =
                    card.position
                      ?.trim()
                      .toUpperCase() ===
                    "GK";

                  const stats = goalkeeper
                    ? [
                        [
                          "REF",
                          card.reflexes,
                        ],
                        [
                          "PRE",
                          card.predicting,
                        ],
                        [
                          "STP",
                          card.shotStopping,
                        ],
                        [
                          "POS",
                          card.positioning,
                        ],
                        [
                          "PAS",
                          card.passing,
                        ],
                        [
                          "COM",
                          card.composure,
                        ],
                      ]
                    : [
                        [
                          "POS",
                          card.positioning,
                        ],
                        [
                          "SHO",
                          card.shooting,
                        ],
                        [
                          "PAS",
                          card.passing,
                        ],
                        [
                          "DRI",
                          card.dribbling,
                        ],
                        [
                          "DEF",
                          card.defending,
                        ],
                        [
                          "CON",
                          card.ballControl,
                        ],
                      ];

                  return (
                    <Link
                      href={`/football/profile/${card.playerUuid}`}
                      key={card.id}
                      className="rounded-2xl border border-white/8 p-4 transition-colors hover:bg-white/[0.03]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <b className="font-display uppercase">
                            {playerName(
                              card.username,
                              card.playerUuid,
                            )}
                          </b>

                          <p className="text-sm text-muted-foreground">
                            {pretty(
                              card.cardType,
                            )}{" "}
                            ·{" "}
                            {
                              card.position
                            }
                          </p>
                        </div>

                        <b
                          className="font-display text-3xl"
                          style={{
                            color:
                              theme.hex,
                          }}
                        >
                          {
                            card.overall
                          }
                        </b>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        {stats.map(
                          ([
                            label,
                            value,
                          ]) => (
                            <div
                              key={label}
                              className="rounded-lg border border-white/6 p-2"
                            >
                              <span className="text-muted-foreground">
                                {
                                  label
                                }
                              </span>{" "}
                              <b>
                                {value ??
                                  "—"}
                              </b>
                            </div>
                          ),
                        )}
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function SeasonTotals({
  stats,
}: {
  stats: HistoricalStatLine;
}) {
  const entries = [
    ["Matches", stats.matches],
    ["Goals", stats.goals],
    ["Assists", stats.assists],
    ["Passes", stats.passes],
    ["Shots", stats.shotsOnNet],
    ["Saves", stats.saves],
    [
      "Clean sheets",
      stats.cleanSheets,
    ],
    ["Wins", stats.wins],
    ["Draws", stats.draws],
    ["Losses", stats.losses],
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {entries.map(
        ([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {label}
            </p>

            <b className="mt-1 block font-display text-2xl">
              {value}
            </b>
          </div>
        ),
      )}
    </div>
  );
}

function PlayerTable({
  players,
  sortKey,
  accent,
}: {
  players: LeagueSeasonPlayer[];
  sortKey: SortKey;
  accent: string;
}) {
  const columns: Array<
    [SortKey, string]
  > = [
    ["matches", "MP"],
    ["goals", "G"],
    ["assists", "A"],
    ["passes", "P"],
    ["shotsOnNet", "SH"],
    ["saves", "SV"],
    ["cleanSheets", "CS"],
    ["wins", "W"],
    ["draws", "D"],
    ["losses", "L"],
  ];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[920px]">
        <div className="grid grid-cols-[56px_minmax(180px,1fr)_repeat(10,62px)] border-b border-border px-3 pb-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span>#</span>
          <span>Player</span>

          {columns.map(
            ([key, label]) => (
              <span
                key={key}
                className="text-center"
                style={{
                  color:
                    key === sortKey
                      ? accent
                      : undefined,
                }}
              >
                {label}
              </span>
            ),
          )}
        </div>

        {players.map(
          (player, index) => (
            <Link
              href={`/football/profile/${player.playerUuid}`}
              key={
                player.playerUuid
              }
              className="grid grid-cols-[56px_minmax(180px,1fr)_repeat(10,62px)] items-center border-b border-border/60 px-3 py-3.5 hover:bg-white/[0.025]"
            >
              <b
                className="font-display text-lg"
                style={{
                  color:
                    index < 3
                      ? accent
                      : undefined,
                }}
              >
                {index + 1}
              </b>

              <span className="font-semibold">
                {playerName(
                  player.username,
                  player.playerUuid,
                )}
              </span>

              {columns.map(
                ([key]) => (
                  <span
                    key={key}
                    className="text-center"
                    style={{
                      fontWeight:
                        key ===
                        sortKey
                          ? 700
                          : 400,
                      color:
                        key ===
                        sortKey
                          ? accent
                          : undefined,
                    }}
                  >
                    {
                      player[
                        key
                      ]
                    }
                  </span>
                ),
              )}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}