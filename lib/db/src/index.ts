import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

type Schema = typeof schema;

let _pool: InstanceType<typeof Pool> | null = null;
let _db: NodePgDatabase<Schema> | null = null;

function _getDb(): NodePgDatabase<Schema> {
  if (!_db) {
    const url =
      process.env["CUSTOM_DATABASE_URL"] || process.env["DATABASE_URL"];
    if (!url) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    _pool = new Pool({ connectionString: url });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

// Lazy proxy — existing `import { db }` imports keep working without any changes.
// The pool is only created on the first request, by which time the startup
// code in index.ts has already set CUSTOM_DATABASE_URL if a config file exists.
export const db = new Proxy({} as NodePgDatabase<Schema>, {
  get(_, prop, receiver) {
    return Reflect.get(_getDb(), prop, receiver);
  },
  has(_, prop) {
    return Reflect.has(_getDb(), prop);
  },
});

export function getPool(): InstanceType<typeof Pool> {
  _getDb(); // ensure initialized
  return _pool!;
}

/** Test a connection string without affecting the active pool. */
export async function testConnection(url: string): Promise<void> {
  const testPool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await testPool.query("SELECT 1");
  } finally {
    await testPool.end().catch(() => {});
  }
}

export * from "./schema";
