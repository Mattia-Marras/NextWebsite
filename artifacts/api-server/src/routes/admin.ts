import { Router } from "express";
import { isAdmin, loginAdmin, logoutAdmin, requireAdmin } from "../lib/admin-auth";
import { queryBlockball } from "../lib/blockball-db";
import type { RowDataPacket } from "mysql2/promise";

const router = Router();
const validLeagues = new Set(["ML", "LL"]);
const league = (value: unknown) => {
  const code = String(value || "").toUpperCase();
  if (!validLeagues.has(code)) throw new Error("Invalid BlockBall league");
  return code;
};

router.get("/admin/session", (req, res) => res.json({ authenticated: isAdmin(req) }));
router.post("/admin/login", loginAdmin);
router.post("/admin/logout", logoutAdmin);

router.get("/admin/blockball/teams", requireAdmin, async (req, res, next) => {
  try {
    const code = league(req.query.league || "ML");
    const rows = await queryBlockball<(RowDataPacket & Record<string, unknown>)[]>(`SELECT * FROM blockball_league_teams WHERE league_code=? ORDER BY sort_order,id`, [code]);
    return res.json(rows);
  } catch (e) { return next(e); }
});
router.post("/admin/blockball/teams", requireAdmin, async (req, res, next) => {
  try {
    const code = league(req.body.league);
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "Team name is required" });
    const orderRows = await queryBlockball<(RowDataPacket & { nextOrder: number })[]>(`SELECT COALESCE(MAX(sort_order),0)+1 nextOrder FROM blockball_league_teams WHERE league_code=?`, [code]);
    const result = await queryBlockball<any>(`INSERT INTO blockball_league_teams (league_code,team_name,team_code,sort_order) VALUES (?,?,?,?)`, [code, name, name.slice(0,3).toUpperCase(), orderRows[0]?.nextOrder || 1]);
    return res.status(201).json({ id: (result as any).insertId });
  } catch (e) { return next(e); }
});
router.patch("/admin/blockball/teams/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id); const name = String(req.body.name || "").trim();
    if (!id || !name) return res.status(400).json({ error: "Valid id and name are required" });
    await queryBlockball<any>(`UPDATE blockball_league_teams SET team_name=?,team_code=? WHERE id=?`, [name, name.slice(0,3).toUpperCase(), id]);
    await queryBlockball<any>(`UPDATE blockball_league_matches SET team1_name=? WHERE team1_id=?`, [name,id]);
    await queryBlockball<any>(`UPDATE blockball_league_matches SET team2_name=? WHERE team2_id=?`, [name,id]);
    return res.json({ ok: true });
  } catch (e) { return next(e); }
});
router.delete("/admin/blockball/teams/:id", requireAdmin, async (req, res, next) => {
  try { await queryBlockball<any>(`DELETE FROM blockball_league_teams WHERE id=?`, [Number(req.params.id)]); return res.status(204).send(); } catch (e) { return next(e); }
});

router.get("/admin/blockball/matches", requireAdmin, async (req, res, next) => {
  try { const code=league(req.query.league||"ML"); return res.json(await queryBlockball<(RowDataPacket & Record<string,unknown>)[]>(`SELECT * FROM blockball_league_matches WHERE league_code=? ORDER BY played_at DESC,id DESC`,[code])); } catch(e){ return next(e); }
});
router.post("/admin/blockball/matches", requireAdmin, async (req,res,next)=>{
  try {
    const code=league(req.body.league); const t1=Number(req.body.team1Id); const t2=Number(req.body.team2Id);
    if(!t1||!t2||t1===t2) return res.status(400).json({error:"Select two different teams"});
    const teams=await queryBlockball<(RowDataPacket & {id:number;team_name:string})[]>(`SELECT id,team_name FROM blockball_league_teams WHERE league_code=? AND id IN (?,?)`,[code,t1,t2]);
    if(teams.length!==2) return res.status(400).json({error:"Invalid teams"});
    const a=teams.find(t=>Number(t.id)===t1)!; const b=teams.find(t=>Number(t.id)===t2)!;
    await queryBlockball<any>(`INSERT INTO blockball_league_matches (league_code,team1_id,team2_id,team1_name,team2_name,score1,score2,matchday,played_at) VALUES (?,?,?,?,?,?,?,?,COALESCE(?,CURRENT_TIMESTAMP))`,[code,t1,t2,a.team_name,b.team_name,Number(req.body.score1||0),Number(req.body.score2||0),req.body.matchday||null,req.body.playedAt||null]);
    return res.status(201).json({ok:true});
  } catch(e){ return next(e); }
});
router.patch("/admin/blockball/matches/:id", requireAdmin, async (req,res,next)=>{
  try { await queryBlockball<any>(`UPDATE blockball_league_matches SET score1=?,score2=?,matchday=? WHERE id=?`,[Number(req.body.score1||0),Number(req.body.score2||0),req.body.matchday||null,Number(req.params.id)]); return res.json({ok:true}); } catch(e){ return next(e); }
});
router.delete("/admin/blockball/matches/:id", requireAdmin, async (req,res,next)=>{
  try { await queryBlockball<any>(`DELETE FROM blockball_league_matches WHERE id=?`,[Number(req.params.id)]); return res.status(204).send(); } catch(e){ return next(e); }
});
export default router;
