import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { testConnection } from "@workspace/db";

const router = Router();

const CONFIG_PATH = path.join(process.cwd(), "db.config.json");

function readConfig(): { url?: string } {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) as {
      url?: string;
    };
  } catch {
    return {};
  }
}

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return url.replace(/:([^@/]+)@/, ":***@");
  }
}

// GET /api/database/status — current connection info
router.get("/database/status", (_req, res) => {
  const cfg = readConfig();
  const customUrl = process.env["CUSTOM_DATABASE_URL"];
  const activeUrl = customUrl || process.env["DATABASE_URL"] || null;
  res.json({
    hasCustom: Boolean(cfg.url),
    maskedUrl: activeUrl ? maskUrl(activeUrl) : null,
    isCustomActive: Boolean(customUrl),
  });
});

// POST /api/database/test — test a connection string without saving
router.post("/database/test", async (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }
  try {
    await testConnection(url);
    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ ok: false, error: message });
  }
});

// POST /api/database/connect — save and restart with new URL
router.post("/database/connect", async (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  // Test first
  try {
    await testConnection(url);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ ok: false, error: message });
    return;
  }

  // Save config
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ url }, null, 2));

  res.json({ ok: true, restarting: true });

  // Restart after response is flushed
  setTimeout(() => process.exit(0), 300);
});

// DELETE /api/database/custom — remove custom config, revert to default
router.delete("/database/custom", (_req, res) => {
  try {
    fs.unlinkSync(CONFIG_PATH);
  } catch {
    // already gone
  }
  res.json({ ok: true, restarting: true });
  setTimeout(() => process.exit(0), 300);
});

export default router;
