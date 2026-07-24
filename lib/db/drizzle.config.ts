import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

/** Resolve the active database URL.
 *  Priority: db.config.json (set via admin panel) → CUSTOM_DATABASE_URL → DATABASE_URL
 */
function getDatabaseUrl(): string {
  // Look for a db.config.json written by the admin panel's "Save & Connect" action
  const candidates = [
    path.join(process.cwd(), "db.config.json"),
    path.join(__dirname, "..", "..", "artifacts", "api-server", "db.config.json"),
  ];
  for (const p of candidates) {
    try {
      const cfg = JSON.parse(fs.readFileSync(p, "utf-8")) as { url?: string };
      if (cfg.url) return cfg.url;
    } catch {
      // file not found or invalid JSON — try next
    }
  }

  const url = process.env["CUSTOM_DATABASE_URL"] ?? process.env["DATABASE_URL"];
  if (!url) {
    throw new Error(
      "No database URL found. Set DATABASE_URL or connect a custom database via the admin panel.",
    );
  }
  return url;
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: { url: getDatabaseUrl() },
  // Human-readable migration folder (not used in push mode, but good practice)
  out: path.join(__dirname, "./migrations"),
});
