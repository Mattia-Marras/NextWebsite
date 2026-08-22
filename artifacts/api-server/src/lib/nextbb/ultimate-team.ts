import type { RowDataPacket } from "mysql2/promise";
import { queryBlockball } from "../blockball-db";

interface BlockballUtRow extends RowDataPacket {
  id: number;
  player_uuid: string;
  username: string | null;
  season_id: string;
  card_type: string;
  position: string;
  stats_profile: string;
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  total_copies?: string | number | null;
  owners?: string | number | null;
  quantity?: number | null;
  first_obtained_at?: Date | string | null;
}

export interface BlockballUltimateTeamCard {
  id: number;
  playerUuid: string;
  username: string | null;
  seasonId: string;
  cardType: string;
  position: string;
  statsProfile: string;
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  totalCopies?: number;
  owners?: number;
  quantity?: number;
  firstObtainedAt?: string | null;
}

function numeric(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapCard(row: BlockballUtRow): BlockballUltimateTeamCard {
  return {
    id: numeric(row.id),
    playerUuid: row.player_uuid,
    username: row.username,
    seasonId: row.season_id,
    cardType: row.card_type,
    position: row.position,
    statsProfile: row.stats_profile,
    overall: numeric(row.overall),
    pace: numeric(row.pace),
    shooting: numeric(row.shooting),
    passing: numeric(row.passing),
    dribbling: numeric(row.dribbling),
    defending: numeric(row.defending),
    physical: numeric(row.physical),
    ...(row.total_copies !== undefined ? { totalCopies: numeric(row.total_copies) } : {}),
    ...(row.owners !== undefined ? { owners: numeric(row.owners) } : {}),
    ...(row.quantity !== undefined ? { quantity: numeric(row.quantity) } : {}),
    ...(row.first_obtained_at !== undefined ? {
      firstObtainedAt: row.first_obtained_at instanceof Date
        ? row.first_obtained_at.toISOString()
        : row.first_obtained_at ? String(row.first_obtained_at) : null,
    } : {}),
  };
}

const CARD_COLUMNS = `
  c.id,c.player_uuid,COALESCE(n.name,NULL) username,c.season_id,c.card_type,c.position,
  c.stats_profile,c.overall,c.pace,c.shooting,c.passing,c.dribbling,c.defending,c.physical`;

export async function getGlobalBlockballUltimateTeamCards(): Promise<BlockballUltimateTeamCard[]> {
  const rows = await queryBlockball<BlockballUtRow[]>(`
    SELECT ${CARD_COLUMNS},
           COALESCE(SUM(col.quantity),0) total_copies,
           COUNT(DISTINCT col.owner_uuid) owners
    FROM ultimate_cards c
    LEFT JOIN player_names n ON n.uuid=c.player_uuid
    LEFT JOIN ultimate_card_collection col ON col.card_id=c.id
    GROUP BY c.id,c.player_uuid,n.name,c.season_id,c.card_type,c.position,c.stats_profile,
             c.overall,c.pace,c.shooting,c.passing,c.dribbling,c.defending,c.physical
    ORDER BY c.overall DESC,c.season_id DESC,c.id DESC`);
  return rows.map(mapCard);
}

export async function getBlockballUltimateTeamCollection(ownerUuid: string): Promise<BlockballUltimateTeamCard[]> {
  const rows = await queryBlockball<BlockballUtRow[]>(`
    SELECT ${CARD_COLUMNS},col.quantity,col.first_obtained_at
    FROM ultimate_card_collection col
    INNER JOIN ultimate_cards c ON c.id=col.card_id
    LEFT JOIN player_names n ON n.uuid=c.player_uuid
    WHERE col.owner_uuid=?
    ORDER BY c.overall DESC,c.season_id DESC,c.id DESC`, [ownerUuid]);
  return rows.map(mapCard);
}
