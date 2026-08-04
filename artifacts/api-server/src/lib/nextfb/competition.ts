import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { nextFootballPool, queryFb } from "./db";

export type LeagueSlug = "main" | "lower";
export type MatchStatus = "scheduled" | "live" | "finished";

interface LeagueRow extends RowDataPacket { id: number; name: string }
interface TeamRow extends RowDataPacket {
  league_id: number;
  league_name: string;
  team_name: string;
}
interface MatchRow extends RowDataPacket {
  id: number;
  league_id: number;
  league_slug: LeagueSlug;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  match_date: Date | string | null;
  status: MatchStatus;
  round_name: string;
  venue: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface OfficialTeam {
  id: number;
  leagueId: number;
  name: string;
  shortName: string;
  server: "football";
  league: LeagueSlug;
  primaryColor: string;
  secondaryColor: string;
  logoInitials: string;
  logoUrl: null;
  createdAt: string;
}

export interface OfficialMatch {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: OfficialTeam;
  awayTeam: OfficialTeam;
  server: "football";
  league: LeagueSlug;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string | null;
  status: MatchStatus;
  round: string;
  venue: string | null;
  createdAt: string;
}

let schemaReady: Promise<void> | null = null;

export function ensureCompetitionSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await nextFootballPool.execute(`
        CREATE TABLE IF NOT EXISTS website_matches (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          league_id BIGINT NOT NULL,
          league_slug VARCHAR(32) NOT NULL,
          home_team_name VARCHAR(128) NOT NULL,
          away_team_name VARCHAR(128) NOT NULL,
          home_score INT NULL,
          away_score INT NULL,
          match_date DATETIME NULL,
          status ENUM('scheduled','live','finished') NOT NULL DEFAULT 'scheduled',
          round_name VARCHAR(128) NOT NULL,
          venue VARCHAR(255) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          INDEX website_matches_league_status_date_idx (league_id, status, match_date),
          INDEX website_matches_slug_status_date_idx (league_slug, status, match_date),
          CONSTRAINT website_matches_distinct_teams CHECK (home_team_name <> away_team_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Existing installations originally required a date. Allow fixtures to be created
      // before their day and kickoff time have been announced.
      await nextFootballPool.execute(`
        ALTER TABLE website_matches
        MODIFY COLUMN match_date DATETIME NULL
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function stablePositiveId(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const raw = words.length > 1 ? words.map((word) => word[0]).join("") : name.slice(0, 3);
  return raw.slice(0, 3).toUpperCase();
}

function shortName(name: string): string {
  const compact = name.replace(/[^a-zA-Z0-9]/g, "");
  return (compact || name).slice(0, 12);
}

function teamKey(leagueId: number, name: string): string {
  return `${leagueId}:${name.trim().toLowerCase()}`;
}

function toTeam(leagueId: number, league: LeagueSlug, name: string): OfficialTeam {
  return {
    id: stablePositiveId(teamKey(leagueId, name)),
    leagueId,
    name,
    shortName: shortName(name),
    server: "football",
    league,
    primaryColor: league === "main" ? "#70e000" : "#ff7b00",
    secondaryColor: "#0b0f14",
    logoInitials: initials(name),
    logoUrl: null,
    createdAt: new Date(0).toISOString(),
  };
}

async function allLeagues(): Promise<LeagueRow[]> {
  return queryFb<LeagueRow[]>("SELECT id, name FROM leagues ORDER BY id ASC");
}

export async function resolveLeague(slug: LeagueSlug): Promise<LeagueRow> {
  const envKey = slug === "main" ? "NEXTFB_MAIN_LEAGUE_ID" : "NEXTFB_LOWER_LEAGUE_ID";
  const configured = Number(process.env[envKey]);
  const leagues = await allLeagues();

  if (Number.isInteger(configured) && configured > 0) {
    const found = leagues.find((league) => Number(league.id) === configured);
    if (found) return found;
    throw new Error(`${envKey}=${configured} does not exist in NEXT Football leagues`);
  }

  const matcher = slug === "main" ? /main|major|premier/i : /lower|minor|second|division\s*2/i;
  const named = leagues.find((league) => matcher.test(league.name));
  if (named) return named;

  const fallback = slug === "main" ? leagues[0] : leagues[1];
  if (!fallback) throw new Error(`Cannot map '${slug}' because the NEXT Football database has insufficient leagues`);
  return fallback;
}

export async function listOfficialTeams(slug?: LeagueSlug): Promise<OfficialTeam[]> {
  const slugs: LeagueSlug[] = slug ? [slug] : ["main", "lower"];
  const results: OfficialTeam[] = [];
  for (const current of slugs) {
    const league = await resolveLeague(current);
    const rows = await queryFb<TeamRow[]>(`
      SELECT lt.league_id, l.name AS league_name, lt.team_name
      FROM league_teams lt
      INNER JOIN leagues l ON l.id = lt.league_id
      WHERE lt.league_id = ?
      ORDER BY lt.team_name ASC
    `, [league.id]);
    results.push(...rows.map((row) => toTeam(Number(row.league_id), current, row.team_name)));
  }
  return results;
}

export async function getOfficialTeamById(id: number, slug?: LeagueSlug): Promise<OfficialTeam | null> {
  const teams = await listOfficialTeams(slug);
  return teams.find((team) => team.id === id) ?? null;
}

function iso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

async function mapMatches(rows: MatchRow[]): Promise<OfficialMatch[]> {
  const cache = new Map<LeagueSlug, OfficialTeam[]>();
  const output: OfficialMatch[] = [];
  for (const row of rows) {
    let teams = cache.get(row.league_slug);
    if (!teams) {
      teams = await listOfficialTeams(row.league_slug);
      cache.set(row.league_slug, teams);
    }
    const home = teams.find((team) => team.name === row.home_team_name);
    const away = teams.find((team) => team.name === row.away_team_name);
    if (!home || !away) continue;
    output.push({
      id: Number(row.id), homeTeamId: home.id, awayTeamId: away.id,
      homeTeam: home, awayTeam: away, server: "football", league: row.league_slug,
      homeScore: row.home_score === null ? null : Number(row.home_score),
      awayScore: row.away_score === null ? null : Number(row.away_score),
      matchDate: row.match_date == null ? null : iso(row.match_date), status: row.status, round: row.round_name,
      venue: row.venue, createdAt: iso(row.created_at),
    });
  }
  return output;
}

export async function listOfficialMatches(filters: { slug?: LeagueSlug; status?: MatchStatus; limit?: number; ascending?: boolean } = {}): Promise<OfficialMatch[]> {
  await ensureCompetitionSchema();
  const where: string[] = [];
  const params: Array<string | number> = [];
  if (filters.slug) { where.push("league_slug = ?"); params.push(filters.slug); }
  if (filters.status) { where.push("status = ?"); params.push(filters.status); }
  const limit = Math.min(200, Math.max(1, filters.limit ?? 200));
  const rows = await queryFb<MatchRow[]>(`
    SELECT * FROM website_matches
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY (match_date IS NULL) ASC, match_date ${filters.ascending ? "ASC" : "DESC"}
    LIMIT ${limit}
  `, params);
  return mapMatches(rows);
}

export async function getOfficialMatch(id: number): Promise<OfficialMatch | null> {
  await ensureCompetitionSchema();
  const rows = await queryFb<MatchRow[]>("SELECT * FROM website_matches WHERE id = ? LIMIT 1", [id]);
  const mapped = await mapMatches(rows);
  return mapped[0] ?? null;
}

export async function createOfficialMatch(data: {
  homeTeamId: number; awayTeamId: number; league: LeagueSlug; homeScore?: number | null;
  awayScore?: number | null; matchDate: Date | null; status: MatchStatus; round: string; venue?: string | null;
}): Promise<OfficialMatch> {
  await ensureCompetitionSchema();
  const league = await resolveLeague(data.league);
  const [home, away] = await Promise.all([
    getOfficialTeamById(data.homeTeamId, data.league),
    getOfficialTeamById(data.awayTeamId, data.league),
  ]);
  if (!home || !away) throw new Error("Selected team does not belong to the official NEXT Football league");
  if (home.id === away.id) throw new Error("Home and away teams must be different");
  const [result] = await nextFootballPool.execute<ResultSetHeader>(`
    INSERT INTO website_matches
      (league_id, league_slug, home_team_name, away_team_name, home_score, away_score, match_date, status, round_name, venue)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [league.id, data.league, home.name, away.name, data.homeScore ?? null, data.awayScore ?? null,
      data.matchDate, data.status, data.round, data.venue ?? null]);
  const created = await getOfficialMatch(Number(result.insertId));
  if (!created) throw new Error("Match was created but could not be reloaded");
  return created;
}

export async function updateOfficialMatch(id: number, data: Partial<{
  homeScore: number | null; awayScore: number | null; matchDate: Date | null; status: MatchStatus;
  round: string; venue: string | null;
}>): Promise<OfficialMatch | null> {
  await ensureCompetitionSchema();
  const assignments: string[] = [];
  const params: Array<string | number | Date | null> = [];
  if (data.homeScore !== undefined) { assignments.push("home_score = ?"); params.push(data.homeScore); }
  if (data.awayScore !== undefined) { assignments.push("away_score = ?"); params.push(data.awayScore); }
  if (data.matchDate !== undefined) { assignments.push("match_date = ?"); params.push(data.matchDate); }
  if (data.status !== undefined) { assignments.push("status = ?"); params.push(data.status); }
  if (data.round !== undefined) { assignments.push("round_name = ?"); params.push(data.round); }
  if (data.venue !== undefined) { assignments.push("venue = ?"); params.push(data.venue); }
  if (assignments.length) {
    params.push(id);
    await nextFootballPool.execute(`UPDATE website_matches SET ${assignments.join(", ")} WHERE id = ?`, params);
  }
  return getOfficialMatch(id);
}

export async function deleteOfficialMatch(id: number): Promise<boolean> {
  await ensureCompetitionSchema();
  const [result] = await nextFootballPool.execute<ResultSetHeader>("DELETE FROM website_matches WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
