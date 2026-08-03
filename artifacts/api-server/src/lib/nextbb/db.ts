import mysql, {
  type Pool,
  type PoolConnection,
  type RowDataPacket,
} from "mysql2/promise";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be configured`);
  }

  return value;
}

function getPort(name: string, defaultPort: number): number {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return defaultPort;
  }

  const port = Number(rawValue);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`${name} must be a valid TCP port`);
  }

  return port;
}

export const nextBlockballPool: Pool = mysql.createPool({
  host: requireEnvironmentVariable("NEXTBB_DB_HOST"),
  port: getPort("NEXTBB_DB_PORT", 3308),
  database: requireEnvironmentVariable("NEXTBB_DB_NAME"),
  user: requireEnvironmentVariable("NEXTBB_DB_USER"),
  password: requireEnvironmentVariable("NEXTBB_DB_PASSWORD"),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  charset: "utf8mb4",
  timezone: "Z",
});

export async function testNextBlockballConnection(): Promise<void> {
  let connection: PoolConnection | undefined;

  try {
    connection = await nextBlockballPool.getConnection();
    await connection.query("SELECT 1");
  } finally {
    connection?.release();
  }
}

export type SqlParameter =
  | string
  | number
  | boolean
  | Date
  | Buffer
  | null;

export async function queryBb<
  T extends RowDataPacket[],
>(
  sql: string,
  parameters: readonly SqlParameter[] = [],
): Promise<T> {
  const [rows] = await nextBlockballPool.execute<T>(
    sql,
    [...parameters],
  );

  return rows;
}