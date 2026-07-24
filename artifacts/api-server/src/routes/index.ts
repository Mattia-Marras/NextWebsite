import { Router, type IRouter } from "express";
import healthRouter from "./health";
import teamsRouter from "./teams";
import matchesRouter from "./matches";
import standingsRouter from "./standings";
import { settingsRouter } from "./settings";
import databaseRouter from "./database";

const router: IRouter = Router();

router.use(healthRouter);
router.use(teamsRouter);
router.use(matchesRouter);
router.use(standingsRouter);
router.use("/settings", settingsRouter);
router.use(databaseRouter);

export default router;
