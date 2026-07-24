import fs from "node:fs";
import path from "node:path";

// Read custom DB URL from config file BEFORE any route handler runs.
// The db module uses lazy initialization, so the pool is only created on
// the first request — by then this env var is already set.
const configPath = path.join(process.cwd(), "db.config.json");
try {
  const raw = fs.readFileSync(configPath, "utf-8");
  const cfg = JSON.parse(raw) as { url?: string };
  if (cfg.url) {
    process.env["CUSTOM_DATABASE_URL"] = cfg.url;
  }
} catch {
  // No config file yet — use DATABASE_URL from the environment
}

import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
