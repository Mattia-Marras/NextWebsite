export type BoardMode = "football" | "blockball";
export type BoardQuery = (sql: string, params: any[]) => Promise<any[]>;
export class BoardInputError extends Error {}
const integer = (value: unknown, fallback: number, max: number) => {
  if (value == null || value === "") return fallback;
  if (!/^\d+$/.test(String(value)) || Number(value) > max)
    throw new BoardInputError("Invalid numeric filter");
  return Number(value);
};
export const METRICS: Record<string, Record<string, string>> = {
  ranked: {
    mmr: "mmr",
    wins: "wins",
    matches: "matches",
    goals: "goals",
    assists: "assists",
    saves: "saves",
    passes: "passes",
    winRate: "100.0*wins/NULLIF(matches,0)",
    goalsPerMatch: "1.0*goals/NULLIF(matches,0)",
    assistsPerMatch: "1.0*assists/NULLIF(matches,0)",
    savesPerMatch: "1.0*saves/NULLIF(matches,0)",
  },
  league: {
    goals: "goals",
    assists: "assists",
    saves: "saves",
    matches: "matches",
    goalsPerMatch: "1.0*goals/NULLIF(matches,0)",
    assistsPerMatch: "1.0*assists/NULLIF(matches,0)",
    savesPerMatch: "1.0*saves/NULLIF(matches,0)",
  },
  economy: { coins: "coins" },
  gamebet: {
    net: "won-lost",
    staked: "staked",
    won: "won",
    lost: "lost",
    plays: "plays",
  },
  ut: {
    uniqueCards: "uniqueCards",
    copies: "copies",
    completion: "100.0*uniqueCards/NULLIF(catalogue,0)",
  },
  progression: { level: "level", xp: "xp" },
  classic: {
    goals: "goals",
    assists: "assists",
    saves: "saves",
    passes: "passes",
    matches: "matches",
  },
};
export async function exploreLeaderboard(
  mode: BoardMode,
  input: Record<string, unknown>,
  run: BoardQuery,
) {
  const category = String(input.category ?? "ranked");
  if (
    !Object.hasOwn(METRICS, category) ||
    (mode === "blockball" && category === "classic")
  )
    throw new BoardInputError("Invalid leaderboard category");
  const options = METRICS[category];
  const metric = String(input.metric ?? Object.keys(options)[0]);
  if (!Object.hasOwn(options, metric))
    throw new BoardInputError("Invalid leaderboard statistic");
  const limit = Math.max(1, integer(input.limit, 25, 100));
  const offset = integer(input.offset, 0, 10000000);
  const rate = metric === "winRate" || metric.endsWith("PerMatch");
  const minMatches = Math.max(
    rate ? 1 : 0,
    integer(input.minMatches, rate ? 20 : 0, 1000000),
  );
  const league = String(input.league ?? "ML");
  if (!["ML", "LL"].includes(league))
    throw new BoardInputError("Invalid league");
  const requestedSeason = String(input.season ?? "");
  if (requestedSeason && !/^[A-Za-z0-9_-]{1,64}$/.test(requestedSeason))
    throw new BoardInputError("Invalid season");
  const bb = mode === "blockball";
  let source = "";
  let params: any[] = [];
  let seasons: string[] = [];
  let selectedSeason = requestedSeason;
  if (category === "ranked") {
    source = bb
      ? `SELECT uuid,mmr,COALESCE(NULLIF(games,0),COALESCE(wins,0)+COALESCE(losses,0)) matches,COALESCE(wins,0) wins,COALESCE(losses,0) losses,COALESCE(goals,0) goals,COALESCE(assists,0) assists,COALESCE(saves,0) saves,COALESCE(passes,0) passes FROM players WHERE mmr IS NOT NULL`
      : `SELECT rp.uuid,rp.mmr,rp.wins,rp.losses,COALESCE(NULLIF(MAX(CASE WHEN s.stat='MATCHES_PLAYED' THEN s.value END),0),rp.wins+rp.losses) matches,COALESCE(MAX(CASE WHEN s.stat='GOALS' THEN s.value END),0) goals,COALESCE(MAX(CASE WHEN s.stat='ASSISTS' THEN s.value END),0) assists,COALESCE(MAX(CASE WHEN s.stat='SAVES' THEN s.value END),0) saves,COALESCE(MAX(CASE WHEN s.stat='PASSES' THEN s.value END),0) passes FROM ranked_players rp LEFT JOIN ranked_player_stats s ON s.uuid=rp.uuid WHERE NOT (rp.ranked_ban_until=-1 OR rp.ranked_ban_until>? OR (rp.banned=TRUE AND rp.ranked_ban_until=0)) GROUP BY rp.uuid,rp.mmr,rp.wins,rp.losses`;
    if (!bb) params = [Date.now()];
  } else if (category === "economy" || category === "progression") {
    source = `SELECT uuid,COALESCE(coins,0) coins,COALESCE(level,0) level,COALESCE(xp,0) xp FROM players`;
  } else if (category === "gamebet") {
    source = `SELECT uuid,COALESCE(total_plays,0) plays,COALESCE(total_bet,0) staked,COALESCE(total_won,0) won,COALESCE(total_lost,0) lost FROM casino_player_stats`;
  } else if (category === "ut") {
    const cards = bb ? "ultimate_cards" : "nf_ut_cards";
    const collection = bb ? "ultimate_card_collection" : "nf_ut_collection";
    seasons = (
      await run(
        `SELECT DISTINCT season_id season FROM ${cards} ORDER BY season_id DESC`,
        [],
      )
    ).map((row) => String(row.season));
    const filter = requestedSeason ? " WHERE c.season_id=?" : "";
    source = `SELECT col.owner_uuid uuid,COUNT(DISTINCT c.id) uniqueCards,SUM(col.quantity) copies,(SELECT COUNT(*) FROM ${cards}${requestedSeason ? " WHERE season_id=?" : ""}) catalogue FROM ${collection} col JOIN ${cards} c ON c.id=col.card_id${filter}${filter ? " AND" : " WHERE"} col.quantity>0 GROUP BY col.owner_uuid`;
    if (requestedSeason) params = [requestedSeason, requestedSeason];
  } else if (category === "league") {
    const table = bb
      ? "league_player_season_stats"
      : "nf_league_season_history";
    const field = bb ? "league_id" : "league_name";
    seasons = (
      await run(
        bb
          ? `SELECT season_id season FROM ${table} WHERE UPPER(${field})=? GROUP BY season_id ORDER BY MIN(finalized) ASC,season_id DESC`
          : `SELECT DISTINCT season_id season FROM ${table} WHERE UPPER(${field})=? AND finalized=TRUE ORDER BY season_id DESC`,
        [league],
      )
    ).map((row) => String(row.season));
    if (!bb && (!requestedSeason || requestedSeason === "CURRENT")) {
      selectedSeason = "CURRENT";
      source = `SELECT ps.player_uuid uuid,ps.matches_played matches,ps.goals,ps.assists,ps.saves FROM player_stats ps JOIN leagues l ON l.id=ps.league_id WHERE l.name=?`;
      params = [league === "ML" ? "Main League" : "Lower League"];
    } else {
      selectedSeason = requestedSeason || seasons[0] || "";
      source = `SELECT player_uuid uuid,matches,goals,assists,saves FROM ${table} WHERE UPPER(${field})=? AND season_id=?${bb ? "" : " AND finalized=TRUE"}`;
      params = [league, selectedSeason];
    }
  } else {
    // Classic uses the same legacy-global fallback as the existing profile API.
    source = `SELECT p.uuid,COALESCE(ms.GOALS,CASE WHEN ms.uuid IS NULL THEN gs.GOALS END,0) goals,COALESCE(ms.ASSISTS,CASE WHEN ms.uuid IS NULL THEN gs.ASSISTS END,0) assists,COALESCE(ms.SAVES,CASE WHEN ms.uuid IS NULL THEN gs.SAVES END,0) saves,COALESCE(ms.PASSES,CASE WHEN ms.uuid IS NULL THEN gs.PASSES END,0) passes,COALESCE(ms.MATCHES_PLAYED,CASE WHEN ms.uuid IS NULL THEN gs.MATCHES_PLAYED END,0) matches FROM players p LEFT JOIN (SELECT uuid,MAX(CASE WHEN stat='GOALS' THEN value END) GOALS,MAX(CASE WHEN stat='ASSISTS' THEN value END) ASSISTS,MAX(CASE WHEN stat='SAVES' THEN value END) SAVES,MAX(CASE WHEN stat='PASSES' THEN value END) PASSES,MAX(CASE WHEN stat='MATCHES_PLAYED' THEN value END) MATCHES_PLAYED FROM player_mode_stats WHERE mode='DEFAULT' GROUP BY uuid) ms ON ms.uuid=p.uuid LEFT JOIN (SELECT uuid,MAX(CASE WHEN stat='GOALS' THEN value END) GOALS,MAX(CASE WHEN stat='ASSISTS' THEN value END) ASSISTS,MAX(CASE WHEN stat='SAVES' THEN value END) SAVES,MAX(CASE WHEN stat='PASSES' THEN value END) PASSES,MAX(CASE WHEN stat='MATCHES_PLAYED' THEN value END) MATCHES_PLAYED FROM player_stats_global GROUP BY uuid) gs ON gs.uuid=p.uuid`;
  }
  const sampleCategory = ["ranked", "league", "classic"].includes(category);
  const where = sampleCategory
    ? ` WHERE COALESCE(matches,0)>=?${rate ? " AND matches>0" : ""}`
    : "";
  const allParams = sampleCategory ? [...params, minMatches] : params;
  const value = options[metric];
  const relation = `(${source}) data`;
  const [rows, counts] = await Promise.all([
    run(
      `SELECT data.*,(${value}) value FROM ${relation}${where} ORDER BY value DESC,${sampleCategory ? "matches DESC," : ""}uuid ASC LIMIT ${limit} OFFSET ${offset}`,
      allParams,
    ),
    run(`SELECT COUNT(*) total FROM ${relation}${where}`, allParams),
  ]);
  return {
    category,
    metric,
    league,
    season: selectedSeason,
    seasons,
    minMatches,
    limit,
    offset,
    total: Number(counts[0]?.total ?? 0),
    data: rows.map((row, index) => {
      const normalized: Record<string, number | string | null> = {};
      for (const [key, value] of Object.entries(row))
        normalized[key] =
          key === "uuid"
            ? String(value).toLowerCase()
            : value == null
              ? null
              : Number(value);
      return {
        ...normalized,
        uuid: String(row.uuid).toLowerCase(),
        position: offset + index + 1,
      };
    }),
  };
}
