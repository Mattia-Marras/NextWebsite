import { Router } from "express";
import { requireAdmin } from "../lib/admin-auth";
import {
  getOfficialTeamById,
  listOfficialTeams,
  type LeagueSlug,
} from "../lib/nextfb/competition";
import {
  GetTeamParams,
  ListTeamsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function asLeagueSlug(value: string | undefined): LeagueSlug | undefined {
  return value === "main" || value === "lower" ? value : undefined;
}

router.get("/teams", async (req, res, next) => {
  try {
    const qp = ListTeamsQueryParams.safeParse(req.query);
    if (!qp.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    // The public/admin team source is now exclusively the official NEXT Football DB.
    // Blockball remains intentionally empty until its own official DB adapter is added.
    if (qp.data.server === "blockball") {
      res.json([]);
      return;
    }

    const teams = await listOfficialTeams(asLeagueSlug(qp.data.league));
    res.json(teams);
  } catch (error) {
    next(error);
  }
});

router.get("/teams/:id", async (req, res, next) => {
  try {
    const params = GetTeamParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const team = await getOfficialTeamById(params.data.id);
    if (!team) {
      res.status(404).json({ error: "Team not found in the official NEXT Football database" });
      return;
    }
    res.json(team);
  } catch (error) {
    next(error);
  }
});

function managedByPlugin(_req: unknown, res: any) {
  res.status(405).json({
    error: "League teams are managed by the NEXT Football plugin database and cannot be created, edited, or deleted from the website.",
  });
}

router.post("/teams", requireAdmin, managedByPlugin);
router.patch("/teams/:id", requireAdmin, managedByPlugin);
router.delete("/teams/:id", requireAdmin, managedByPlugin);

export default router;
