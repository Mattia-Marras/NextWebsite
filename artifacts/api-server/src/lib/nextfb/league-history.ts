import type { RowDataPacket } from "mysql2/promise";
import { queryFb } from "./db";
<<<<<<< HEAD
=======
import { resolveMinecraftPlayersByUuids } from "./mojang";
>>>>>>> a1e1a08 (league support for nextfb)

export type LeagueCode = "ML" | "LL";

export interface HistoricalStatLine {
  matches: number;
  goals: number;
  assists: number;
  passes: number;
  shotsOnNet: number;
  saves: number;
  cleanSheets: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface LeagueAwardRecord {
  id: number;
  league: LeagueCode;
  season: string;
  playerUuid: string;
  awardType: string;
  amount: number;
}

export interface LeagueRewardRecord {
  id: number;
  league: LeagueCode;
  season: string;
  playerUuid: string;
  rewardType: string;
  amount: number;
  details: string | null;
}

export interface LeagueCardRecord {
  id: number;
  league: string;
  season: string;
  playerUuid: string;
  cardType: string;
  position: string;
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface PlayerLeagueSeasonRecord extends HistoricalStatLine {
  league: LeagueCode;
  season: string;
  finalized: boolean;
}

export interface PlayerLeagueHistoryView {
  current: Record<LeagueCode, HistoricalStatLine | null>;
  pastSeasons: PlayerLeagueSeasonRecord[];
  totalsByLeague: Record<LeagueCode, HistoricalStatLine>;
  careerFinalized: HistoricalStatLine;
  careerWithCurrent: HistoricalStatLine;
  awards: LeagueAwardRecord[];
  rewards: LeagueRewardRecord[];
  cards: LeagueCardRecord[];
}

export interface LeagueSeasonOverview extends HistoricalStatLine {
  season: string;
  players: number;
  finalized: boolean;
}

export interface LeagueHistoryOverview {
  league: LeagueCode;
  current: LeagueSeasonOverview;
  pastSeasons: LeagueSeasonOverview[];
  finalizedTotal: HistoricalStatLine;
  totalWithCurrent: HistoricalStatLine;
  awards: LeagueAwardRecord[];
  rewards: LeagueRewardRecord[];
  cards: LeagueCardRecord[];
}

<<<<<<< HEAD
=======
export interface LeagueSeasonPlayer extends HistoricalStatLine {
  playerUuid: string;
  username: string | null;
}

export interface LeagueSeasonAward extends LeagueAwardRecord {
  username: string | null;
}

export interface LeagueSeasonReward extends LeagueRewardRecord {
  username: string | null;
}

export interface LeagueSeasonCard extends LeagueCardRecord {
  username: string | null;
}

export interface LeagueSeasonDetail {
  league: LeagueCode;
  season: string;
  finalized: boolean;
  totals: HistoricalStatLine;
  players: LeagueSeasonPlayer[];
  awards: LeagueSeasonAward[];
  rewards: LeagueSeasonReward[];
  cards: LeagueSeasonCard[];
}

>>>>>>> a1e1a08 (league support for nextfb)
interface AnyRow extends RowDataPacket { [key: string]: any }

const ZERO: HistoricalStatLine = {
  matches: 0, goals: 0, assists: 0, passes: 0, shotsOnNet: 0,
  saves: 0, cleanSheets: 0, wins: 0, draws: 0, losses: 0,
};

function n(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

function stats(row?: Record<string, any> | null): HistoricalStatLine {
  if (!row) return { ...ZERO };
  return {
    matches: n(row.matches ?? row.matches_played),
    goals: n(row.goals),
    assists: n(row.assists),
    passes: n(row.passes),
    shotsOnNet: n(row.shots_on_net ?? row.shotsOnNet),
    saves: n(row.saves),
    cleanSheets: n(row.clean_sheets ?? row.cleanSheets),
    wins: n(row.wins),
    draws: n(row.draws),
    losses: n(row.losses),
  };
}

function plus(a: HistoricalStatLine, b: HistoricalStatLine): HistoricalStatLine {
  return {
    matches: a.matches + b.matches,
    goals: a.goals + b.goals,
    assists: a.assists + b.assists,
    passes: a.passes + b.passes,
    shotsOnNet: a.shotsOnNet + b.shotsOnNet,
    saves: a.saves + b.saves,
    cleanSheets: a.cleanSheets + b.cleanSheets,
    wins: a.wins + b.wins,
    draws: a.draws + b.draws,
    losses: a.losses + b.losses,
  };
}

export function normalizeLeagueCode(value: string): LeagueCode {
  const v = value.trim().toUpperCase().replaceAll("_", " ").replaceAll("-", " ");
  if (v === "ML" || v === "MAIN" || v === "MAIN LEAGUE") return "ML";
  if (v === "LL" || v === "LOWER" || v === "LOWER LEAGUE") return "LL";
  throw new Error(`Invalid league: ${value}`);
}

function liveLeagueName(code: LeagueCode): string {
  return code === "ML" ? "Main League" : "Lower League";
}

async function optional<T extends RowDataPacket[]>(sql: string, params: any[] = []): Promise<T> {
  try {
    return await queryFb<T>(sql, params);
  } catch (error: any) {
    const code = String(error?.code ?? "");
    if (["ER_NO_SUCH_TABLE", "ER_BAD_FIELD_ERROR"].includes(code)) return [] as unknown as T;
    throw error;
  }
}

async function currentPlayerStats(uuid: string, code: LeagueCode): Promise<HistoricalStatLine | null> {
  const rows = await queryFb<AnyRow[]>(
    `SELECT ps.matches_played,ps.goals,ps.assists,ps.passes,ps.shots_on_net,ps.saves
     FROM player_stats ps JOIN leagues l ON l.id=ps.league_id
     WHERE ps.player_uuid=? AND l.name=? LIMIT 1`,
    [uuid, liveLeagueName(code)],
  );
  return rows[0] ? stats(rows[0]) : null;
}

async function currentLeagueTotal(code: LeagueCode): Promise<LeagueSeasonOverview> {
  const rows = await queryFb<AnyRow[]>(
    `SELECT COUNT(*) players,COALESCE(SUM(ps.matches_played),0) matches,
            COALESCE(SUM(ps.goals),0) goals,COALESCE(SUM(ps.assists),0) assists,
            COALESCE(SUM(ps.passes),0) passes,COALESCE(SUM(ps.shots_on_net),0) shots_on_net,
            COALESCE(SUM(ps.saves),0) saves
     FROM player_stats ps JOIN leagues l ON l.id=ps.league_id WHERE l.name=?`,
    [liveLeagueName(code)],
  );
  return { season: "CURRENT", players: n(rows[0]?.players), finalized: false, ...stats(rows[0]) };
}

function mapAward(row: AnyRow): LeagueAwardRecord {
  return { id: n(row.id), league: normalizeLeagueCode(row.league_name), season: String(row.season_id), playerUuid: String(row.player_uuid), awardType: String(row.award_type), amount: n(row.amount) };
}
function mapReward(row: AnyRow): LeagueRewardRecord {
  return { id: n(row.id), league: normalizeLeagueCode(row.league_name), season: String(row.season_id), playerUuid: String(row.player_uuid), rewardType: String(row.reward_type), amount: n(row.amount), details: row.details == null ? null : String(row.details) };
}
function mapCard(row: AnyRow): LeagueCardRecord {
  return {
    id: n(row.id), league: String(row.league_name ?? "GLOBAL"), season: String(row.season_id ?? ""), playerUuid: String(row.player_uuid),
    cardType: String(row.card_type ?? ""), position: String(row.position ?? ""), overall: n(row.overall), pace: n(row.pace), shooting: n(row.shooting),
    passing: n(row.passing), dribbling: n(row.dribbling), defending: n(row.defending), physical: n(row.physical),
  };
}

export async function getPlayerLeagueHistory(uuid: string): Promise<PlayerLeagueHistoryView> {
  const [mlCurrent, llCurrent, seasonRows, careerRows, awardRows, rewardRows, cardRows] = await Promise.all([
    currentPlayerStats(uuid, "ML"), currentPlayerStats(uuid, "LL"),
    optional<AnyRow[]>(`SELECT * FROM nf_league_season_history WHERE player_uuid=? AND finalized=TRUE ORDER BY season_id DESC,league_name`, [uuid]),
    optional<AnyRow[]>(`SELECT * FROM nf_league_career_stats WHERE player_uuid=? LIMIT 1`, [uuid]),
    optional<AnyRow[]>(`SELECT * FROM nf_league_awards WHERE player_uuid=? ORDER BY season_id DESC,league_name,award_type`, [uuid]),
    optional<AnyRow[]>(`SELECT * FROM nf_league_rewards WHERE player_uuid=? ORDER BY season_id DESC,league_name,id DESC`, [uuid]),
    optional<AnyRow[]>(`SELECT * FROM nf_ut_cards WHERE player_uuid=? ORDER BY season_id DESC,id DESC`, [uuid]),
  ]);

  const pastSeasons: PlayerLeagueSeasonRecord[] = seasonRows.map((row) => ({ league: normalizeLeagueCode(row.league_name), season: String(row.season_id), finalized: Boolean(row.finalized), ...stats(row) }));
  const mlPast = pastSeasons.filter((s) => s.league === "ML").reduce((a, s) => plus(a, s), { ...ZERO });
  const llPast = pastSeasons.filter((s) => s.league === "LL").reduce((a, s) => plus(a, s), { ...ZERO });
  const mlTotal = plus(mlPast, mlCurrent ?? ZERO);
  const llTotal = plus(llPast, llCurrent ?? ZERO);
  const careerFinalized = stats(careerRows[0]);

  return {
    current: { ML: mlCurrent, LL: llCurrent },
    pastSeasons,
    totalsByLeague: { ML: mlTotal, LL: llTotal },
    careerFinalized,
    careerWithCurrent: plus(careerFinalized, plus(mlCurrent ?? ZERO, llCurrent ?? ZERO)),
    awards: awardRows.map(mapAward),
    rewards: rewardRows.map(mapReward),
    cards: cardRows.map(mapCard),
  };
}

export async function getLeagueHistoryOverview(rawLeague: string): Promise<LeagueHistoryOverview> {
  const code = normalizeLeagueCode(rawLeague);
  const [current, seasonRows, awardRows, rewardRows, cardRows] = await Promise.all([
    currentLeagueTotal(code),
    optional<AnyRow[]>(`SELECT season_id,COUNT(*) players,MAX(finalized) finalized,
      SUM(matches) matches,SUM(goals) goals,SUM(assists) assists,SUM(passes) passes,SUM(shots_on_net) shots_on_net,SUM(saves) saves,
      SUM(clean_sheets) clean_sheets,SUM(wins) wins,SUM(draws) draws,SUM(losses) losses
      FROM nf_league_season_history WHERE league_name=? AND finalized=TRUE GROUP BY season_id ORDER BY season_id DESC`, [code]),
    optional<AnyRow[]>(`SELECT * FROM nf_league_awards WHERE league_name=? ORDER BY season_id DESC,award_type,player_uuid`, [code]),
    optional<AnyRow[]>(`SELECT * FROM nf_league_rewards WHERE league_name=? ORDER BY season_id DESC,id DESC`, [code]),
    optional<AnyRow[]>(`SELECT * FROM nf_ut_cards WHERE league_name=? ORDER BY season_id DESC,id DESC`, [code]),
  ]);
  const pastSeasons = seasonRows.map((row) => ({ season: String(row.season_id), players: n(row.players), finalized: Boolean(row.finalized), ...stats(row) }));
  const finalizedTotal = pastSeasons.reduce((a, s) => plus(a, s), { ...ZERO });
  return { league: code, current, pastSeasons, finalizedTotal, totalWithCurrent: plus(finalizedTotal, current), awards: awardRows.map(mapAward), rewards: rewardRows.map(mapReward), cards: cardRows.map(mapCard) };
}
<<<<<<< HEAD
=======


/** Full, read-only detail for one finalized NextFootball past season. */
export async function getLeagueSeasonDetail(rawLeague: string, rawSeason: string): Promise<LeagueSeasonDetail | null> {
  const code = normalizeLeagueCode(rawLeague);
  const season = rawSeason.trim();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(season)) throw new Error(`Invalid season: ${rawSeason}`);

  const [playerRows, awardRows, rewardRows, cardRows] = await Promise.all([
    optional<AnyRow[]>(`SELECT player_uuid,matches,goals,assists,passes,shots_on_net,saves,clean_sheets,wins,draws,losses,finalized
      FROM nf_league_season_history WHERE league_name=? AND season_id=? AND finalized=TRUE`, [code, season]),
    optional<AnyRow[]>(`SELECT * FROM nf_league_awards WHERE league_name=? AND season_id=? ORDER BY award_type,amount DESC,player_uuid`, [code, season]),
    optional<AnyRow[]>(`SELECT * FROM nf_league_rewards WHERE league_name=? AND season_id=? ORDER BY reward_type,amount DESC,id`, [code, season]),
    optional<AnyRow[]>(`SELECT * FROM nf_ut_cards WHERE league_name=? AND season_id=? ORDER BY overall DESC,card_type,player_uuid`, [code, season]),
  ]);

  if (playerRows.length === 0) return null;

  const uuids = [...new Set([
    ...playerRows.map((row) => String(row.player_uuid)),
    ...awardRows.map((row) => String(row.player_uuid)),
    ...rewardRows.map((row) => String(row.player_uuid)),
    ...cardRows.map((row) => String(row.player_uuid)),
  ])];
  const identities = await resolveMinecraftPlayersByUuids(uuids);
  const usernameFor = (uuid: string) => identities.get(uuid.toLowerCase())?.username ?? null;

  const players: LeagueSeasonPlayer[] = playerRows.map((row) => {
    const playerUuid = String(row.player_uuid);
    return { playerUuid, username: usernameFor(playerUuid), ...stats(row) };
  });
  const totals = players.reduce((total, player) => plus(total, player), { ...ZERO });

  return {
    league: code,
    season,
    finalized: true,
    totals,
    players,
    awards: awardRows.map((row) => {
      const value = mapAward(row);
      return { ...value, username: usernameFor(value.playerUuid) };
    }),
    rewards: rewardRows.map((row) => {
      const value = mapReward(row);
      return { ...value, username: usernameFor(value.playerUuid) };
    }),
    cards: cardRows.map((row) => {
      const value = mapCard(row);
      return { ...value, username: usernameFor(value.playerUuid) };
    }),
  };
}
>>>>>>> a1e1a08 (league support for nextfb)
