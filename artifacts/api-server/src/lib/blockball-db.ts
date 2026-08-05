import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

function env(name: string, fallback?: string): string {
  const value = process.env[name]?.trim() || fallback;
  if (!value) throw new Error(`${name} must be configured`);
  return value;
}

export const blockballPool: Pool = mysql.createPool({
  host: env("BLOCKBALL_DB_HOST", process.env.NEXTFB_DB_HOST),
  port: Number(process.env.BLOCKBALL_DB_PORT || 3308),
  database: env("BLOCKBALL_DB_NAME", "BlockBall"),
  user: env("BLOCKBALL_DB_USER", process.env.NEXTFB_DB_USER),
  password: env("BLOCKBALL_DB_PASSWORD", process.env.NEXTFB_DB_PASSWORD),
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

export async function queryBlockball<T extends RowDataPacket[]>(sql: string, params: readonly unknown[] = []): Promise<T> {
  const [rows] = await blockballPool.execute<T>(sql, [...params]);
  return rows;
}
