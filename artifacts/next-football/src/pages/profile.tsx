import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  Ban,
  Coins,
  Crown,
  Gamepad2,
  Goal,
  Package,
  Shield,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Link, useParams } from "wouter";

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
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  GAME_MODES,
  NextFootballApiError,
  PlayerStats,
  type GameMode,
  type NextFootballPlayerPage,
  getNextFootballPlayer,
} from "@/lib/nextfb-api";

const PROFILE_ACCENT = "#39ff14";

const MODE_LABELS: Record<GameMode, string> = {
  DEFAULT: "Classic",
  LEAGUE: "League",
  RANKED: "Ranked",
  TRAINING: "Training",
  PLAYOFF: "Playoff",
  SCRIM: "Scrim",
  MINITOURNEY: "Mini Tournament",
  NOHIT: "No Hit",
  HEATSEEKER: "Heatseeker",
  VOLLEYBALL: "Volleyball",
  DODGEBALL: "Dodgeball",
};

const EMPTY_PLAYER_STATS: PlayerStats = {
  GOALS: 0,
  PASSES: 0,
  SHOTS_ON_NET: 0,
  ASSISTS: 0,
  SAVES: 0,
  WINS: 0,
  DRAWS: 0,
  LOSSES: 0,
  MATCHES_PLAYED: 0,
};

function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatPercentage(
  value: number | null | undefined,
  digits = 1,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return `${value.toFixed(digits)}%`;
}

function calculatePercentage(
  numerator: number,
  denominator: number,
): number | null {
  if (denominator <= 0) {
    return null;
  }

  return (numerator / denominator) * 100;
}

function shortenUuid(uuid: string): string {
  if (uuid.length <= 18) {
    return uuid;
  }

  return `${uuid.slice(0, 8)}...${uuid.slice(-8)}`;
}

function mergePlayerStats(
  stats: Partial<PlayerStats> | undefined,
): PlayerStats {
  return {
    ...EMPTY_PLAYER_STATS,
    ...stats,
  };
}

export function Profile() {
  const { uuid = "" } = useParams<{ uuid: string }>();

  let decodedUuid = uuid;

  try {
    decodedUuid = decodeURIComponent(uuid);
  } catch {
    decodedUuid = uuid;
  }

  const playerQuery = useQuery({
    queryKey: ["nextfootball-player", decodedUuid],
    queryFn: () => getNextFootballPlayer(decodedUuid),
    enabled: decodedUuid.length > 0,
  });

  if (playerQuery.isLoading) {
    return <ProfileLoading />;
  }

  if (playerQuery.isError) {
    return (
      <ProfileError
        uuid={decodedUuid}
        error={playerQuery.error}
        onRetry={() => playerQuery.refetch()}
      />
    );
  }

  if (!playerQuery.data) {
    return (
      <ProfileError
        uuid={decodedUuid}
        error={new Error("The player profile could not be loaded.")}
        onRetry={() => playerQuery.refetch()}
      />
    );
  }

  return <ProfileContent player={playerQuery.data} />;
}

function ProfileContent({
  player,
}: {
  player: NextFootballPlayerPage;
}) {
  const { profile, ranked, leagues, casino, cosmetics } = player;

  const globalStats = mergePlayerStats(profile.globalStats);
  const winRate = calculatePercentage(
    globalStats.WINS,
    globalStats.MATCHES_PLAYED,
  );

  const xpProgress = Math.max(0, profile.xp % 1000);
  const xpProgressPercentage = Math.min(100, xpProgress / 10);

  return (
    <div className="flex flex-col pb-16">
      <section className="relative overflow-hidden border-b border-border bg-background py-14 md:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full blur-[140px]"
            style={{
              backgroundColor: `${PROFILE_ACCENT}18`,
            }}
          />

          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.025] mix-blend-overlay" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="mb-8">
            <Link href="/football/players">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-[#39ff14]"
              >
                <ArrowLeft className="h-4 w-4" />
                Search another NextFootball player
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border bg-card shadow-2xl"
                style={{
                  borderColor: `${PROFILE_ACCENT}55`,
                  boxShadow: `0 0 45px ${PROFILE_ACCENT}18`,
                }}
              >
                <UserRound
                  className="h-12 w-12"
                  style={{ color: PROFILE_ACCENT }}
                />
              </div>

              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-display uppercase tracking-[0.2em]"
                    style={{
                      color: PROFILE_ACCENT,
                      borderColor: `${PROFILE_ACCENT}55`,
                      backgroundColor: `${PROFILE_ACCENT}12`,
                    }}
                  >
                    NextFootball
                  </Badge>

                  <Badge
                    variant="secondary"
                    className="font-display uppercase tracking-[0.15em]"
                  >
                    Football Player
                  </Badge>
                </div>

                <h1 className="font-display text-4xl font-bold uppercase tracking-tight md:text-6xl">
                  NextFootball Player Profile
                </h1>

                <p
                  className="mt-3 break-all font-mono text-sm text-muted-foreground"
                  title={profile.uuid}
                >
                  {shortenUuid(profile.uuid)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <HeaderMetric
                icon={<Crown className="h-5 w-5" />}
                label="Level"
                value={formatNumber(profile.level)}
              />

              <HeaderMetric
                icon={<Activity className="h-5 w-5" />}
                label="XP"
                value={formatNumber(profile.xp)}
              />

              <HeaderMetric
                icon={<Coins className="h-5 w-5" />}
                label="Coins"
                value={formatNumber(profile.coins)}
              />
            </div>
          </div>

          <div className="mt-10 max-w-xl">
            <div className="mb-2 flex items-center justify-between text-xs font-display uppercase tracking-widest text-muted-foreground">
              <span>Level progress</span>
              <span>{formatNumber(xpProgress)} / 1,000 XP</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${xpProgressPercentage}%`,
                  backgroundColor: PROFILE_ACCENT,
                  boxShadow: `0 0 12px ${PROFILE_ACCENT}`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 pt-10">
        <Tabs defaultValue="overview" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="h-auto min-w-max justify-start gap-1 bg-card p-1">
              <TabsTrigger
                value="overview"
                className="font-display uppercase tracking-wider"
              >
                Overview
              </TabsTrigger>

              <TabsTrigger
                value="modes"
                className="font-display uppercase tracking-wider"
              >
                Modes
              </TabsTrigger>

              <TabsTrigger
                value="ranked"
                className="font-display uppercase tracking-wider"
              >
                Ranked
              </TabsTrigger>

              <TabsTrigger
                value="leagues"
                className="font-display uppercase tracking-wider"
              >
                Leagues
              </TabsTrigger>

              <TabsTrigger
                value="casino"
                className="font-display uppercase tracking-wider"
              >
                Casino
              </TabsTrigger>

              <TabsTrigger
                value="cosmetics"
                className="font-display uppercase tracking-wider"
              >
                Cosmetics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-8">
            <OverviewSection
              stats={globalStats}
              winRate={winRate}
              ranked={ranked}
              leagueCount={leagues.length}
              cosmeticsCount={cosmetics.availableCount}
            />
          </TabsContent>

          <TabsContent value="modes" className="mt-8">
            <ModesSection player={player} />
          </TabsContent>

          <TabsContent value="ranked" className="mt-8">
            <RankedSection player={player} />
          </TabsContent>

          <TabsContent value="leagues" className="mt-8">
            <LeaguesSection player={player} />
          </TabsContent>

          <TabsContent value="casino" className="mt-8">
            <CasinoSection player={player} />
          </TabsContent>

          <TabsContent value="cosmetics" className="mt-8">
            <CosmeticsSection player={player} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function OverviewSection({
  stats,
  winRate,
  ranked,
  leagueCount,
  cosmeticsCount,
}: {
  stats: PlayerStats;
  winRate: number | null;
  ranked: NextFootballPlayerPage["ranked"];
  leagueCount: number;
  cosmeticsCount: number;
}) {
  return (
    <div className="space-y-8">
      <SectionHeading
        title="Career overview"
        description="Combined player statistics across NextFootball."
        icon={<Activity className="h-6 w-6" />}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Matches"
          value={stats.MATCHES_PLAYED}
          icon={<Gamepad2 className="h-5 w-5" />}
        />

        <StatCard
          label="Wins"
          value={stats.WINS}
          icon={<Trophy className="h-5 w-5" />}
        />

        <StatCard
          label="Draws"
          value={stats.DRAWS}
          icon={<Shield className="h-5 w-5" />}
        />

        <StatCard
          label="Losses"
          value={stats.LOSSES}
          icon={<Ban className="h-5 w-5" />}
        />

        <StatCard
          label="Win rate"
          value={formatPercentage(winRate)}
          icon={<Target className="h-5 w-5" />}
        />

        <StatCard
          label="Rank"
          value={ranked?.rank.displayWithDivision ?? "Unranked"}
          icon={<Crown className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Goals"
          value={stats.GOALS}
          icon={<Goal className="h-5 w-5" />}
        />

        <StatCard
          label="Assists"
          value={stats.ASSISTS}
          icon={<Activity className="h-5 w-5" />}
        />

        <StatCard
          label="Passes"
          value={stats.PASSES}
          icon={<ArrowLeft className="h-5 w-5 rotate-180" />}
        />

        <StatCard
          label="Shots on net"
          value={stats.SHOTS_ON_NET}
          icon={<Target className="h-5 w-5" />}
        />

        <StatCard
          label="Saves"
          value={stats.SAVES}
          icon={<Shield className="h-5 w-5" />}
        />

        <StatCard
          label="MMR"
          value={ranked?.mmr ?? "—"}
          icon={<Trophy className="h-5 w-5" />}
        />

        <StatCard
          label="Leagues"
          value={leagueCount}
          icon={<Crown className="h-5 w-5" />}
        />

        <StatCard
          label="Cosmetics"
          value={cosmeticsCount}
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}

function ModesSection({
  player,
}: {
  player: NextFootballPlayerPage;
}) {
  const availableModes = GAME_MODES.filter((mode) => {
    const stats = player.profile.modeStats[mode];

    if (!stats) {
      return false;
    }

    return Object.values(stats).some((value) => value > 0);
  });

  const modesToShow =
    availableModes.length > 0 ? availableModes : GAME_MODES;

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Game modes"
        description="Statistics separated by individual NextFootball mode."
        icon={<Gamepad2 className="h-6 w-6" />}
      />

      <Tabs
        defaultValue={modesToShow[0] ?? "DEFAULT"}
        className="w-full"
      >
        <div className="overflow-x-auto pb-2">
          <TabsList className="h-auto min-w-max justify-start gap-1 bg-card p-1">
            {modesToShow.map((mode) => (
              <TabsTrigger
                key={mode}
                value={mode}
                className="font-display uppercase tracking-wider"
              >
                {MODE_LABELS[mode]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {modesToShow.map((mode) => {
          const modeStats = mergePlayerStats(
            player.profile.modeStats[mode],
          );

          return (
            <TabsContent key={mode} value={mode} className="mt-6">
              <ModeStatsGrid mode={mode} stats={modeStats} />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function ModeStatsGrid({
  mode,
  stats,
}: {
  mode: GameMode;
  stats: PlayerStats;
}) {
  const winRate = calculatePercentage(
    stats.WINS,
    stats.MATCHES_PLAYED,
  );

  return (
    <Card className="border-border bg-card/70">
      <CardHeader>
        <CardTitle className="font-display text-2xl uppercase tracking-wider">
          {MODE_LABELS[mode]}
        </CardTitle>

        <CardDescription>
          Complete statistics for this game mode.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Matches" value={stats.MATCHES_PLAYED} />
          <StatCard label="Wins" value={stats.WINS} />
          <StatCard label="Draws" value={stats.DRAWS} />
          <StatCard label="Losses" value={stats.LOSSES} />
          <StatCard
            label="Win rate"
            value={formatPercentage(winRate)}
          />
          <StatCard label="Goals" value={stats.GOALS} />
          <StatCard label="Assists" value={stats.ASSISTS} />
          <StatCard label="Passes" value={stats.PASSES} />
          <StatCard
            label="Shots on net"
            value={stats.SHOTS_ON_NET}
          />
          <StatCard label="Saves" value={stats.SAVES} />
        </div>
      </CardContent>
    </Card>
  );
}

function RankedSection({
  player,
}: {
  player: NextFootballPlayerPage;
}) {
  const ranked = player.ranked;

  if (!ranked) {
    return (
      <EmptySection
        title="No ranked profile"
        description="This player has not played ranked matches yet."
        icon={<Trophy className="h-8 w-8" />}
      />
    );
  }

  const stats = ranked.stats;
  const winRate = calculatePercentage(
    ranked.wins,
    ranked.wins + ranked.losses,
  );

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Ranked profile"
        description="Competitive rank, MMR and ranked performance."
        icon={<Trophy className="h-6 w-6" />}
      />

      <Card className="overflow-hidden border-border bg-card/70">
        <div
          className="h-1 w-full"
          style={{ backgroundColor: PROFILE_ACCENT }}
        />

        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Current rank
              </p>

              <div className="mt-3 flex items-center gap-4">
                <span className="text-4xl">
                  {ranked.rank.symbol}
                </span>

                <div>
                  <h3 className="font-display text-3xl font-bold uppercase">
                    {ranked.rank.displayWithDivision}
                  </h3>

                  <p className="mt-1 text-muted-foreground">
                    {formatNumber(ranked.mmr)} MMR
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {ranked.banned && (
                <Badge variant="destructive">
                  Ranked banned
                </Badge>
              )}

              {ranked.permanentBan && (
                <Badge variant="destructive">
                  Permanent ban
                </Badge>
              )}

              {!ranked.banned && !ranked.permanentBan && (
                <Badge
                  variant="outline"
                  style={{
                    color: PROFILE_ACCENT,
                    borderColor: `${PROFILE_ACCENT}55`,
                  }}
                >
                  Active
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="MMR" value={ranked.mmr} />
        <StatCard label="Wins" value={ranked.wins} />
        <StatCard label="Losses" value={ranked.losses} />
        <StatCard
          label="Win rate"
          value={formatPercentage(winRate)}
        />
        <StatCard
          label="Matches"
          value={stats.MATCHES_PLAYED}
        />
        <StatCard label="Goals" value={stats.GOALS} />
        <StatCard label="Assists" value={stats.ASSISTS} />
        <StatCard label="Saves" value={stats.SAVES} />
        <StatCard label="Passes" value={stats.PASSES} />
        <StatCard
          label="Shots on net"
          value={stats.SHOTS_ON_NET}
        />
      </div>
    </div>
  );
}

function LeaguesSection({
  player,
}: {
  player: NextFootballPlayerPage;
}) {
  if (player.leagues.length === 0) {
    return (
      <EmptySection
        title="No league statistics"
        description="This player is not currently associated with a league profile."
        icon={<Crown className="h-8 w-8" />}
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        title="League statistics"
        description="Performance across registered leagues and seasons."
        icon={<Crown className="h-6 w-6" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {player.leagues.map((league) => {
          const statistics = league.statistics;

          return (
            <Card
              key={league.leagueId}
              className="border-border bg-card/70"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-display text-2xl uppercase tracking-wider">
                      {league.leagueName}
                    </CardTitle>

                    <CardDescription className="mt-2">
                      League ID: {league.leagueId}
                    </CardDescription>
                  </div>

                  <Trophy
                    className="h-6 w-6"
                    style={{ color: PROFILE_ACCENT }}
                  />
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <CompactStat
                    label="Matches"
                    value={statistics.matchesPlayed}
                  />

                  <CompactStat
                    label="Goals"
                    value={statistics.goals}
                  />

                  <CompactStat
                    label="Assists"
                    value={statistics.assists}
                  />

                  <CompactStat
                    label="Passes"
                    value={statistics.passes}
                  />

                  <CompactStat
                    label="Shots"
                    value={statistics.shotsOnNet}
                  />

                  <CompactStat
                    label="Saves"
                    value={statistics.saves}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CasinoSection({
  player,
}: {
  player: NextFootballPlayerPage;
}) {
  const casino = player.casino;

  if (!casino) {
    return (
      <EmptySection
        title="No casino statistics"
        description="This player has no registered casino activity."
        icon={<WalletCards className="h-8 w-8" />}
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Casino activity"
        description="Daily and lifetime betting statistics."
        icon={<WalletCards className="h-6 w-6" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CasinoStatsCard
          title="Lifetime"
          plays={casino.totalPlays}
          bet={casino.totalBet}
          won={casino.totalWon}
          lost={casino.totalLost}
          net={casino.totalNet}
          returnRate={casino.totalReturnRate}
        />

        <CasinoStatsCard
          title="Today"
          plays={casino.dailyPlays}
          bet={casino.dailyBet}
          won={casino.dailyWon}
          lost={casino.dailyLost}
          net={casino.dailyNet}
          returnRate={casino.dailyReturnRate}
        />
      </div>
    </div>
  );
}

function CasinoStatsCard({
  title,
  plays,
  bet,
  won,
  lost,
  net,
  returnRate,
}: {
  title: string;
  plays: number;
  bet: number;
  won: number;
  lost: number;
  net: number;
  returnRate: number | null;
}) {
  return (
    <Card className="border-border bg-card/70">
      <CardHeader>
        <CardTitle className="font-display text-2xl uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <CompactStat label="Plays" value={plays} />
          <CompactStat label="Bet" value={bet} />
          <CompactStat label="Won" value={won} />
          <CompactStat label="Lost" value={lost} />
          <CompactStat
            label="Net"
            value={
              net > 0
                ? `+${formatNumber(net)}`
                : formatNumber(net)
            }
            emphasized
          />
          <CompactStat
            label="Return rate"
            value={formatPercentage(returnRate)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CosmeticsSection({
  player,
}: {
  player: NextFootballPlayerPage;
}) {
  const cosmetics = player.cosmetics;

  const groupedCosmetics = cosmetics.available.reduce<
    Record<string, typeof cosmetics.available>
  >((groups, cosmetic) => {
    const type = cosmetic.type ?? "other";

    if (!groups[type]) {
      groups[type] = [];
    }

    groups[type].push(cosmetic);
    return groups;
  }, {});

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Cosmetics"
        description="Unlocked and currently active cosmetic items."
        icon={<Sparkles className="h-6 w-6" />}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Available"
          value={cosmetics.availableCount}
          icon={<Package className="h-5 w-5" />}
        />

        <StatCard
          label="Active"
          value={cosmetics.activeCount}
          icon={<Sparkles className="h-5 w-5" />}
        />

        <StatCard
          label="Categories"
          value={Object.keys(groupedCosmetics).length}
          icon={<Gamepad2 className="h-5 w-5" />}
        />

        <StatCard
          label="Activation rate"
          value={formatPercentage(
            calculatePercentage(
              cosmetics.activeCount,
              cosmetics.availableCount,
            ),
          )}
          icon={<Target className="h-5 w-5" />}
        />
      </div>

      {cosmetics.available.length === 0 ? (
        <EmptySection
          title="No cosmetics unlocked"
          description="This player does not currently own any cosmetic items."
          icon={<Package className="h-8 w-8" />}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(groupedCosmetics).map(
            ([type, items]) => (
              <Card
                key={type}
                className="border-border bg-card/70"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="font-display text-lg uppercase tracking-wider">
                      {formatCosmeticType(type)}
                    </CardTitle>

                    <Badge variant="secondary">
                      {items.length}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2">
                    {items.map((cosmetic) => (
                      <div
                        key={`${cosmetic.type}-${cosmetic.id}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-3 py-2"
                      >
                        <span className="truncate font-mono text-sm">
                          {cosmetic.id}
                        </span>

                        {cosmetic.active && (
                          <Badge
                            variant="outline"
                            style={{
                              color: PROFILE_ACCENT,
                              borderColor: `${PROFILE_ACCENT}55`,
                            }}
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-3xl" />

          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-12 w-72 max-w-full" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>

        <Skeleton className="h-12 w-full max-w-3xl" />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-32 rounded-xl"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileError({
  uuid,
  error,
  onRetry,
}: {
  uuid: string;
  error: unknown;
  onRetry: () => void;
}) {
  let title = "Unable to load profile";
  let description =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred.";

  if (
    error instanceof NextFootballApiError &&
    error.status === 404
  ) {
    title = "Player not found";
    description =
      "No NextFootball profile exists for the requested UUID.";
  }

  return (
    <div className="container mx-auto flex min-h-[65vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-xl border-border bg-card/80 text-center">
        <CardContent className="flex flex-col items-center p-8 md:p-12">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <UserRound className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="font-display text-3xl font-bold uppercase">
            {title}
          </h1>

          <p className="mt-4 max-w-md text-muted-foreground">
            {description}
          </p>

          <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
            {uuid}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/football/players">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to NextFootball players
              </Button>
            </Link>

            <Button onClick={onRetry}>
              Retry request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HeaderMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-32 rounded-xl border border-border bg-card/70 p-4 backdrop-blur-sm">
      <div
        className="mb-2 flex items-center gap-2"
        style={{ color: PROFILE_ACCENT }}
      >
        {icon}

        <span className="font-display text-xs uppercase tracking-widest">
          {label}
        </span>
      </div>

      <div className="font-display text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-card/70">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="font-display text-xs uppercase tracking-widest text-muted-foreground">
            {label}
          </p>

          {icon && (
            <div style={{ color: PROFILE_ACCENT }}>
              {icon}
            </div>
          )}
        </div>

        <p className="break-words font-display text-2xl font-bold md:text-3xl">
          {typeof value === "number"
            ? formatNumber(value)
            : value}
        </p>
      </CardContent>
    </Card>
  );
}

function CompactStat({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: number | string;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-4">
      <p className="font-display text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>

      <p
        className="mt-2 font-display text-xl font-bold"
        style={
          emphasized
            ? { color: PROFILE_ACCENT }
            : undefined
        }
      >
        {typeof value === "number"
          ? formatNumber(value)
          : value}
      </p>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
        style={{
          color: PROFILE_ACCENT,
          borderColor: `${PROFILE_ACCENT}45`,
          backgroundColor: `${PROFILE_ACCENT}10`,
        }}
      >
        {icon}
      </div>

      <div>
        <h2 className="font-display text-3xl font-bold uppercase tracking-wider">
          {title}
        </h2>

        <p className="mt-2 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function EmptySection({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-dashed border-border bg-card/50">
      <CardContent className="flex flex-col items-center px-6 py-16 text-center">
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            color: PROFILE_ACCENT,
            backgroundColor: `${PROFILE_ACCENT}10`,
          }}
        >
          {icon}
        </div>

        <h2 className="font-display text-2xl font-bold uppercase">
          {title}
        </h2>

        <p className="mt-3 max-w-md text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function formatCosmeticType(type: string): string {
  return type
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase(),
    )
    .join(" ");
}