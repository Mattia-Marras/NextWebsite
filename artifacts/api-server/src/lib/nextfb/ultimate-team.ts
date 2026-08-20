import type { RowDataPacket } from "mysql2/promise";
import { queryFb } from "./db";
import { resolveMinecraftPlayersByUuids } from "./mojang";

interface UtCardRow extends RowDataPacket {
  id: number;
  player_uuid: string;
  league_name: string;
  season_id: string;
  card_type: string;
  position: string;
  overall: number;
  positioning: number | null;
  shooting: number | null;
  passing: number | null;
  dribbling: number | null;
  defending: number | null;
  ball_control: number | null;
  reflexes: number | null;
  predicting: number | null;
  shot_stopping: number | null;
  composure: number | null;
  total_copies?: string | number | null;
  owners?: string | number | null;
  quantity?: number | null;
  first_obtained_at?: Date | string | null;
}

export interface UltimateTeamCard {
  id: number;
  playerUuid: string;
  username: string | null;
  leagueName: string;
  seasonId: string;
  cardType: string;
  position: string;
  overall: number;
  positioning: number | null;
  shooting: number | null;
  passing: number | null;
  dribbling: number | null;
  defending: number | null;
  ballControl: number | null;
  reflexes: number | null;
  predicting: number | null;
  shotStopping: number | null;
  composure: number | null;
  totalCopies?: number;
  owners?: number;
  quantity?: number;
  firstObtainedAt?: string | null;
}

function numberValue(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapRow(row: UtCardRow, username: string | null): UltimateTeamCard {
  return {
    id: Number(row.id),
    playerUuid: row.player_uuid,
    username,
    leagueName: row.league_name,
    seasonId: row.season_id,
    cardType: row.card_type,
    position: row.position,
    overall: Number(row.overall),
    positioning: row.positioning === null ? null : Number(row.positioning),
    shooting: row.shooting === null ? null : Number(row.shooting),
    passing: row.passing === null ? null : Number(row.passing),
    dribbling: row.dribbling === null ? null : Number(row.dribbling),
    defending: row.defending === null ? null : Number(row.defending),
    ballControl: row.ball_control === null ? null : Number(row.ball_control),
    reflexes: row.reflexes === null ? null : Number(row.reflexes),
    predicting: row.predicting === null ? null : Number(row.predicting),
    shotStopping: row.shot_stopping === null ? null : Number(row.shot_stopping),
    composure: row.composure === null ? null : Number(row.composure),
    ...(row.total_copies !== undefined ? { totalCopies: numberValue(row.total_copies) } : {}),
    ...(row.owners !== undefined ? { owners: numberValue(row.owners) } : {}),
    ...(row.quantity !== undefined ? { quantity: Number(row.quantity ?? 0) } : {}),
    ...(row.first_obtained_at !== undefined
      ? { firstObtainedAt: row.first_obtained_at instanceof Date ? row.first_obtained_at.toISOString() : row.first_obtained_at ? String(row.first_obtained_at) : null }
      : {}),
  };
}

async function attachUsernames(rows: UtCardRow[]): Promise<UltimateTeamCard[]> {
  const identities = await resolveMinecraftPlayersByUuids(rows.map((row) => row.player_uuid));
  return rows.map((row) => mapRow(row, identities.get(row.player_uuid)?.username ?? null));
}

export async function getGlobalUltimateTeamCards(): Promise<UltimateTeamCard[]> {
  const rows = await queryFb<UtCardRow[]>(`
    SELECT
      c.id, c.player_uuid, c.league_name, c.season_id, c.card_type, c.position, c.overall,
      c.positioning, c.shooting, c.passing, c.dribbling, c.defending, c.ball_control,
      c.reflexes, c.predicting, c.shot_stopping, c.composure,
      COALESCE(SUM(col.quantity), 0) AS total_copies,
      COUNT(DISTINCT col.owner_uuid) AS owners
    FROM nf_ut_cards c
    LEFT JOIN nf_ut_collection col ON col.card_id = c.id
    GROUP BY
      c.id, c.player_uuid, c.league_name, c.season_id, c.card_type, c.position, c.overall,
      c.positioning, c.shooting, c.passing, c.dribbling, c.defending, c.ball_control,
      c.reflexes, c.predicting, c.shot_stopping, c.composure
    ORDER BY c.overall DESC, c.season_id DESC, c.id DESC
  `);
  return attachUsernames(rows);
}

export async function getPlayerUltimateTeamCollection(ownerUuid: string): Promise<UltimateTeamCard[]> {
  const rows = await queryFb<UtCardRow[]>(`
    SELECT
      c.id, c.player_uuid, c.league_name, c.season_id, c.card_type, c.position, c.overall,
      c.positioning, c.shooting, c.passing, c.dribbling, c.defending, c.ball_control,
      c.reflexes, c.predicting, c.shot_stopping, c.composure,
      col.quantity, col.first_obtained_at
    FROM nf_ut_collection col
    INNER JOIN nf_ut_cards c ON c.id = col.card_id
    WHERE col.owner_uuid = ?
    ORDER BY c.overall DESC, c.season_id DESC, c.id DESC
  `, [ownerUuid]);
  return attachUsernames(rows);
}
