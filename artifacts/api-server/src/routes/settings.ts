import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const settingsRouter = Router();

const KEYS = ["minecraftIp", "discordUrl"] as const;
type SettingKey = (typeof KEYS)[number];

async function getAll(): Promise<Record<SettingKey, string | null>> {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string | null> = {};
  for (const key of KEYS) map[key] = null;
  for (const row of rows) map[row.key] = row.value;
  return map as Record<SettingKey, string | null>;
}

settingsRouter.get("/", async (_req, res) => {
  const settings = await getAll();
  res.json(settings);
});

settingsRouter.patch("/", async (req, res) => {
  const body = req.body as Partial<Record<SettingKey, string | null>>;
  for (const key of KEYS) {
    if (key in body) {
      const val = body[key];
      if (val === null || val === "") {
        await db.delete(settingsTable).where(eq(settingsTable.key, key));
      } else {
        await db
          .insert(settingsTable)
          .values({ key, value: val!, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: settingsTable.key,
            set: { value: val!, updatedAt: new Date() },
          });
      }
    }
  }
  const settings = await getAll();
  res.json(settings);
});
