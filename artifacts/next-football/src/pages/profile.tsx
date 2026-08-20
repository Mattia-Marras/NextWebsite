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

import { getRankTheme } from "@/lib/rank-colors";
import { UltimateTeamCard } from "@/components/ultimate-team-card";

import {
  GAME_MODES,
  NextFootballApiError,
  PlayerStats,
  type GameMode,
  type NextFootballPlayerPage,
  getNextFootballPlayer,
  getPlayerMmrHistory,
  getPlayerUltimateTeamCards,
  type HistoricalStatLine,
  type LeagueCode,
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
                  {profile.username?.trim() || "NextFootball Player"}
                </h1>

                <p className="mt-3 text-sm text-muted-foreground">
                  Complete NextFootball player profile
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

              <TabsTrigger
                value="ultimate-team"
                className="font-display uppercase tracking-wider"
              >
                Ultimate Team
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

          <TabsContent value="ultimate-team" className="mt-8">
            <UltimateTeamSection uuid={profile.uuid} />
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
  const historyQuery = useQuery({
    queryKey: ["nextfootball-mmr-history", player.profile.uuid],
    queryFn: () => getPlayerMmrHistory(player.profile.uuid, { limit: 30, offset: 0 }),
    enabled: Boolean(ranked),
  });

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
  const rankTheme = getRankTheme(ranked.rank.name);
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

      <Card
        className="overflow-hidden bg-card/75"
        style={{
          borderColor: rankTheme.border,
          boxShadow: `0 18px 70px ${rankTheme.glow}`,
        }}
      >
        <div
          className="h-1 w-full"
          style={{ backgroundColor: rankTheme.text }}
        />

        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Current rank
              </p>

              <div className="mt-3 flex items-center gap-4">
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border text-4xl"
                  style={{
                    color: rankTheme.text,
                    borderColor: rankTheme.border,
                    backgroundColor: rankTheme.background,
                  }}
                >
                  {ranked.rank.symbol}
                </span>

                <div>
                  <h3
                    className="font-display text-3xl font-bold uppercase"
                    style={{ color: rankTheme.text }}
                  >
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

      <MmrTrendCard
        currentMmr={ranked.mmr}
        entries={historyQuery.data?.data ?? []}
        loading={historyQuery.isLoading}
      />

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

function MmrTrendCard({
  currentMmr,
  entries,
  loading,
}: {
  currentMmr: number;
  entries: Array<{ mmr: number; createdAt: string }>;
  loading: boolean;
}) {
  const ordered = [...entries].reverse();
  const values = ordered.length > 0 ? ordered.map((entry) => entry.mmr) : [currentMmr];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const width = 900;
  const height = 220;
  const padding = 22;
  const coordinates = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y, value };
  });
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  const first = values[0];
  const latest = values[values.length - 1];
  const change = values.length > 1 ? latest - first : 0;
  const changeColor = change > 0 ? "#4ade80" : change < 0 ? "#fb7185" : "#cbd5e1";

  return (
    <Card className="overflow-hidden border-border bg-card/70 transition hover:border-white/15">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="font-display text-2xl uppercase tracking-wider">MMR trend</CardTitle>
          <CardDescription className="mt-1">Recent competitive rating progression.</CardDescription>
        </div>
        <Badge
          variant="outline"
          style={{
            color: changeColor,
            borderColor: `${changeColor}66`,
            backgroundColor: `${changeColor}14`,
          }}
        >
          {change > 0 ? "+" : ""}{change} MMR
        </Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CompactStat label="Starting" value={first} />
              <CompactStat label="Current" value={latest} emphasized />
              <CompactStat label="Peak" value={max} />
              <CompactStat
                label="Change"
                value={`${change > 0 ? "+" : ""}${formatNumber(change)}`}
                tone={change > 0 ? "positive" : change < 0 ? "negative" : "neutral"}
              />
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-3 transition hover:border-white/15">
              <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible" role="img" aria-label="MMR progression chart">
                <defs>
                  <linearGradient id="mmrArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={PROFILE_ACCENT} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={PROFILE_ACCENT} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((part) => {
                  const y = padding + (height - padding * 2) * part;
                  return <line key={part} x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" opacity="0.08" />;
                })}
                {values.length > 1 && (
                  <polygon points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`} fill="url(#mmrArea)" />
                )}
                <polyline points={points} fill="none" stroke={PROFILE_ACCENT} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                {coordinates.map(({ x, y, value }, index) => (
                  <g key={`${value}-${index}`} className="group/point cursor-pointer">
                    <circle cx={x} cy={y} r="11" fill="transparent" />
                    <circle cx={x} cy={y} r="5" fill={PROFILE_ACCENT} className="transition-all group-hover/point:r-[8]" />
                    <title>{`Entry ${index + 1}: ${formatNumber(value)} MMR`}</title>
                  </g>
                ))}
              </svg>
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>Earlier</span>
                <span>{formatNumber(min)}–{formatNumber(max)} MMR</span>
                <span>Latest</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function prettyLeagueValue(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function LeagueStatGrid({ stats }: { stats: HistoricalStatLine }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <CompactStat label="Matches" value={stats.matches} />
      <CompactStat label="Wins" value={stats.wins} />
      <CompactStat label="Draws" value={stats.draws} />
      <CompactStat label="Losses" value={stats.losses} />
      <CompactStat label="Goals" value={stats.goals} />
      <CompactStat label="Assists" value={stats.assists} />
      <CompactStat label="Passes" value={stats.passes} />
      <CompactStat label="Shots" value={stats.shotsOnNet} />
      <CompactStat label="Saves" value={stats.saves} />
      <CompactStat label="Clean sheets" value={stats.cleanSheets} />
    </div>
  );
}


function LeagueCardTile({
  card,
  username,
}: {
  card: NextFootballPlayerPage["leagueHistory"]["cards"][number];
  username?: string | null;
}) {
  const rawPosition = (card.position ?? "").trim().toUpperCase();
  const goalkeeper = rawPosition === "GK";

  /*
   * The league database can contain the generic value "OUTFIELD".
   * Keep the compact "OF" label until a real ST/CM/CB/etc. value exists.
   */
  const displayPosition =
    rawPosition === "OUTFIELD"
      ? "OF"
      : rawPosition || (goalkeeper ? "GK" : "OF");

  const stats: Array<[string, number | null | undefined]> = goalkeeper
    ? [
        ["REF", card.reflexes],
        ["PRE", card.predicting],
        ["STP", card.shotStopping],
        ["POS", card.positioning],
        ["PAS", card.passing],
        ["COM", card.composure],
      ]
    : [
        ["POS", card.positioning],
        ["SHO", card.shooting],
        ["PAS", card.passing],
        ["DRI", card.dribbling],
        ["DEF", card.defending],
        ["CON", card.ballControl],
      ];

  const normalizedType = (card.cardType ?? "").trim().toUpperCase();
  const isTotw =
    normalizedType === "TOTW" ||
    normalizedType === "TEAM_OF_THE_WEEK";

  let template = "/cards/bronzecard.png";

  if (isTotw) {
    template = "/cards/totw_card.png";
  } else if (card.overall >= 85) {
    template = "/cards/goldcard.png";
  } else if (card.overall >= 75) {
    template = "/cards/silvercard.png";
  }

  const cleanUuid = (card.playerUuid ?? "").replace(/-/g, "");
  const displayName = username?.trim() || "PLAYER";
  const encodedName = encodeURIComponent(displayName);

  /*
   * Use a bust renderer instead of the old full-body render. This keeps the
   * face + torso visible, removes the legs entirely and gives the card a much
   * cleaner football-card composition.
   *
   * Crafty's 3D bust is the primary renderer. Visage is kept as UUID-based
   * fallback, followed by the previous full-body API only as a last resort.
   */
  const skinRenderUrl = `https://render.crafty.gg/3d/bust/${encodedName}`;
  const fallbackBustRenderUrl =
    `https://visage.surgeplay.com/bust/512/${cleanUuid}`;
  const fallbackBodyRenderUrl =
    `https://skins.manacube.com/renders/body/${cleanUuid}?scale=10&overlay`;

  const primaryText = isTotw ? "#f4d06f" : "#161616";
  const secondaryText = isTotw ? "#d8b855" : "#282828";
  const dividerColor = isTotw
    ? "rgba(231,196,87,.62)"
    : "rgba(20,20,20,.32)";

  return (
    <article className="group relative mx-auto w-full max-w-[270px]">
      <div
        className="
          relative
          w-full
          overflow-visible
          transition-transform
          duration-300
          ease-out
          group-hover:-translate-y-1
          group-hover:scale-[1.015]
        "
        style={{
          aspectRatio: "753 / 1054",
          filter: "drop-shadow(0 18px 28px rgba(0,0,0,.38))",
        }}
      >
        {/* Card template */}
        <img
          src={template}
          alt=""
          draggable={false}
          className="
            pointer-events-none
            absolute
            inset-0
            z-0
            h-full
            w-full
            select-none
            object-contain
          "
        />

        {/*
         * Player bust.
         * The wrapper acts as a hard crop so even the last-resort full-body
         * renderer can never leak legs into the lower half of the card.
         */}
        {cleanUuid ? (
          <div
            className="pointer-events-none absolute z-20 overflow-hidden"
            style={{
              left: "33%",
              top: "14.2%",
              width: "54.2%",
              height: "40.9%",
            }}
          >
            <img
              src={skinRenderUrl}
              alt=""
              draggable={false}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full select-none object-contain"
              style={{
                objectPosition: "center bottom",
                imageRendering: "pixelated",
                transform: "scale(1.025)",
                transformOrigin: "center bottom",
                filter: isTotw
                  ? "drop-shadow(0 7px 8px rgba(0,0,0,.78))"
                  : "drop-shadow(0 7px 7px rgba(0,0,0,.42))",
              }}
              onError={(event) => {
                const image = event.currentTarget;
                const fallbackStep = image.dataset.fallbackStep ?? "0";

                if (fallbackStep === "0") {
                  image.dataset.fallbackStep = "1";
                  image.src = fallbackBustRenderUrl;
                  return;
                }

                if (fallbackStep === "1") {
                  image.dataset.fallbackStep = "2";
                  image.src = fallbackBodyRenderUrl;
                  image.style.transform = "scale(1.42) translateY(11%)";
                  image.style.transformOrigin = "center top";
                  return;
                }

                image.style.display = "none";
              }}
            />
          </div>
        ) : null}

        {/* Overall */}
        <div
          className="
            absolute
            z-30
            flex
            items-center
            justify-center
            font-display
            font-black
            leading-none
          "
          style={{
            left: "13.6%",
            top: "19.8%",
            width: "20%",
            fontSize: "clamp(30px, 4.2vw, 50px)",
            color: primaryText,
            textShadow: isTotw
              ? "0 2px 3px rgba(0,0,0,.7)"
              : "0 1px 1px rgba(255,255,255,.15)",
          }}
        >
          {card.overall}
        </div>

        {/* Position */}
        <div
          className="
            absolute
            z-30
            text-center
            font-display
            font-black
            uppercase
          "
          style={{
            left: "13.6%",
            top: "30.2%",
            width: "20%",
            fontSize: "clamp(12px, 1.45vw, 17px)",
            lineHeight: 1,
            color: secondaryText,
            letterSpacing: ".045em",
          }}
        >
          {displayPosition}
        </div>

        {/* Player name */}
        <div
          className="
            absolute
            z-30
            overflow-hidden
            whitespace-nowrap
            text-center
            font-display
            font-black
            uppercase
          "
          style={{
            left: "12.5%",
            top: "57.3%",
            width: "75%",
            fontSize:
              displayName.length > 14
                ? "clamp(12px, 1.55vw, 18px)"
                : displayName.length > 10
                  ? "clamp(13px, 1.72vw, 20px)"
                  : "clamp(15px, 1.95vw, 23px)",
            letterSpacing: ".025em",
            lineHeight: 1,
            color: primaryText,
            textOverflow: "ellipsis",
            textShadow: isTotw
              ? "0 2px 3px rgba(0,0,0,.72)"
              : "0 1px 1px rgba(255,255,255,.12)",
          }}
        >
          {displayName}
        </div>

        {/* Divider */}
        <div
          className="absolute z-30"
          style={{
            left: "16.5%",
            top: "61.5%",
            width: "67%",
            height: "1px",
            background: dividerColor,
          }}
        />

        {/* Stats — deliberately wider, larger and evenly spaced */}
        <div
          className="absolute z-30 grid grid-cols-2"
          style={{
            left: "15%",
            top: "64.5%",
            width: "70%",
            rowGap: "10px",
            columnGap: "10%",
          }}
        >
          {stats.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-center font-display uppercase"
              style={{ gap: "8%" }}
            >
              <span
                className="font-black"
                style={{
                  fontSize: "clamp(18px, 2.1vw, 24px)",
                  lineHeight: 1,
                  color: primaryText,
                  minWidth: "1.62em",
                  textAlign: "right",
                  textShadow: isTotw
                    ? "0 1px 2px rgba(0,0,0,.5)"
                    : "none",
                }}
              >
                {value ?? "—"}
              </span>

              <span
                className="font-black"
                style={{
                  fontSize: "clamp(9px, 1.02vw, 12px)",
                  lineHeight: 1,
                  color: secondaryText,
                  minWidth: "2.4em",
                  letterSpacing: ".02em",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* League / season signature — intentionally clear and separated */}
        <div
          className="
            absolute
            z-30
            flex
            flex-col
            items-center
            justify-center
            text-center
            font-display
            uppercase
          "
          style={{
            left: "17%",
            top: "88.4%",
            width: "66%",
            lineHeight: 1,
            color: secondaryText,
          }}
        >
          <span
            className="font-bold"
            style={{
              fontSize: "clamp(6px, .66vw, 8px)",
              letterSpacing: ".18em",
              opacity: isTotw ? 0.72 : 0.52,
              marginBottom: "4px",
            }}
          >
            {card.league === "GLOBAL" ? "NEXTFOOTBALL" : card.league}
          </span>

          <span
            className="font-black"
            style={{
              fontSize: "clamp(11px, 1.18vw, 15px)",
              letterSpacing: ".11em",
              color: primaryText,
              opacity: isTotw ? 0.98 : 0.92,
              textShadow: isTotw
                ? "0 1px 2px rgba(0,0,0,.55)"
                : "0 1px 1px rgba(255,255,255,.12)",
            }}
          >
            SEASON {card.season}
          </span>
        </div>
      </div>
    </article>
  );
}

function LeaguesSection({ player }: { player: NextFootballPlayerPage }) {
  const history = player.leagueHistory;
  const hasAnything = player.leagues.length > 0 || history.pastSeasons.length > 0 || history.cards.length > 0 || history.current.ML || history.current.LL;

  if (!hasAnything) {
    return <EmptySection title="No league statistics" description="This player has no current or historical NextFootball league statistics." icon={<Crown className="h-8 w-8" />} />;
  }

  const labels: Record<LeagueCode, string> = { ML: "Main League", LL: "Lower League" };

  return (
    <div className="space-y-8">
      <SectionHeading title="League career" description="Live current-season data plus finalized past seasons, awards, rewards and cards. Main League and Lower League are always kept separate." icon={<Crown className="h-6 w-6" />} />

      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle className="font-display text-2xl uppercase tracking-wider">Overall career</CardTitle>
          <CardDescription>All finalized ML + LL seasons, with current live player_stats added on top.</CardDescription>
        </CardHeader>
        <CardContent><LeagueStatGrid stats={history.careerWithCurrent} /></CardContent>
      </Card>

      <Card className="border-border bg-card/70">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="font-display text-2xl uppercase tracking-wider">League cards</CardTitle>
              <CardDescription className="mt-2">
                Official player cards earned across NextFootball league seasons. These are separate from Ultimate Team ownership.
              </CardDescription>
            </div>
            <Badge variant="outline">{history.cards.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {history.cards.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {history.cards.map((card) => (
                <LeagueCardTile
                  key={card.id}
                  card={card}
                  username={player.profile.username}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No league cards recorded for this player.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {(["ML", "LL"] as LeagueCode[]).map((code) => {
          const current = history.current[code];
          const total = history.totalsByLeague[code];
          const seasons = history.pastSeasons.filter((item) => item.league === code);
          const awards = history.awards.filter((item) => item.league === code);
          const rewards = history.rewards.filter((item) => item.league === code);

          return (
            <Card key={code} className="border-border bg-card/70">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div><CardTitle className="font-display text-2xl uppercase tracking-wider">{labels[code]}</CardTitle><CardDescription className="mt-2">Current + all finalized past seasons.</CardDescription></div>
                  <Badge variant="outline">{code}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-7">
                <div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">League total</p><LeagueStatGrid stats={total} /></div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="mb-4 flex items-center justify-between"><div><p className="font-display text-lg font-bold uppercase">Current</p><p className="text-xs text-muted-foreground">Live from player_stats</p></div><Badge style={{ borderColor: `${PROFILE_ACCENT}55`, color: PROFILE_ACCENT }} variant="outline">Live</Badge></div>
                  {current ? <LeagueStatGrid stats={current} /> : <p className="text-sm text-muted-foreground">No current {labels[code]} statistics.</p>}
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Past seasons</p>
                  <div className="space-y-3">
                    {seasons.length ? seasons.map((season) => (
                      <div key={`${code}-${season.season}`} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                        <div className="mb-4 flex items-center justify-between"><b className="font-display uppercase">Season {season.season}</b><Badge variant="secondary">Past season</Badge></div>
                        <LeagueStatGrid stats={season} />
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No finalized past seasons for this league.</p>}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Awards</p>
                  <div className="flex flex-wrap gap-2">{awards.length ? awards.map((award) => <Badge key={award.id} variant="outline">{award.season} · {prettyLeagueValue(award.awardType)}{award.amount > 1 ? ` ×${award.amount}` : ""}</Badge>) : <span className="text-sm text-muted-foreground">No awards recorded.</span>}</div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Rewards</p>
                  <div className="space-y-2">{rewards.length ? rewards.map((reward) => <div key={reward.id} className="rounded-xl border border-white/8 px-3 py-2 text-sm"><b>{reward.season} · {prettyLeagueValue(reward.rewardType)} ×{reward.amount}</b>{reward.details ? <p className="mt-1 text-xs text-muted-foreground">{reward.details}</p> : null}</div>) : <span className="text-sm text-muted-foreground">No rewards recorded.</span>}</div>
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
            tone={net > 0 ? "positive" : net < 0 ? "negative" : "neutral"}
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

function UltimateTeamSection({ uuid }: { uuid: string }) {
  const collectionQuery = useQuery({
    queryKey: ["nextfootball-player-ut", uuid],
    queryFn: () => getPlayerUltimateTeamCards(uuid),
    enabled: uuid.length > 0,
  });

  if (collectionQuery.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[315px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (collectionQuery.isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6 text-sm text-destructive">
          Could not load this player's Ultimate Team collection.
        </CardContent>
      </Card>
    );
  }

  const cards = collectionQuery.data?.data ?? [];
  const totalCopies = cards.reduce((sum, card) => sum + (card.quantity ?? 0), 0);

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.25em] text-[#39ff14]">
            Ultimate Team
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold uppercase">Owned cards</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {cards.length} unique cards · {totalCopies} total copies
          </p>
        </div>

        <Link href="/football/ultimate-team">
          <Button variant="outline" className="gap-2">
            <WalletCards className="h-4 w-4" /> Global collection
          </Button>
        </Link>
      </div>

      {cards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <UltimateTeamCard key={card.id} card={card} showOwnership />
          ))}
        </div>
      ) : (
        <Card className="border-white/8 bg-white/[0.02]">
          <CardContent className="flex min-h-40 flex-col items-center justify-center p-8 text-center">
            <WalletCards className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-display font-bold uppercase">No cards owned yet</p>
            <p className="mt-1 text-sm text-muted-foreground">This player has no cards in nf_ut_collection.</p>
          </CardContent>
        </Card>
      )}
    </section>
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
      "No NextFootball profile exists for this player.";
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
  tone = "default",
}: {
  label: string;
  value: number | string;
  emphasized?: boolean;
  tone?: "default" | "positive" | "negative" | "neutral";
}) {
  const toneStyle =
    tone === "positive"
      ? { color: "#4ade80", borderColor: "rgba(74, 222, 128, 0.38)", backgroundColor: "rgba(74, 222, 128, 0.08)" }
      : tone === "negative"
        ? { color: "#fb7185", borderColor: "rgba(251, 113, 133, 0.42)", backgroundColor: "rgba(251, 113, 133, 0.09)" }
        : tone === "neutral"
          ? { color: "#cbd5e1", borderColor: "rgba(203, 213, 225, 0.22)", backgroundColor: "rgba(203, 213, 225, 0.05)" }
          : undefined;

  return (
    <div
      className="rounded-lg border border-border bg-background/50 p-4 transition hover:-translate-y-0.5 hover:border-white/15"
      style={toneStyle}
    >
      <p className="font-display text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>

      <p
        className="mt-2 font-display text-xl font-bold"
        style={toneStyle ? { color: toneStyle.color } : emphasized ? { color: PROFILE_ACCENT } : undefined}
      >
        {typeof value === "number" ? formatNumber(value) : value}
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