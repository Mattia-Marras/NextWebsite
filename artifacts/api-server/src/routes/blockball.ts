import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { queryBlockball } from "../lib/blockball-db";

const router = Router();
const leagues = new Set(["ML", "LL"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const league = (value: unknown) => {
  const result = String(value || "").toUpperCase();
  if (!leagues.has(result)) throw new Error("Invalid league");
  return result;
};

router.get("/league/:league", async (req, res, next) => {
  try {
    const code = league(req.params.league);
    const teams = await queryBlockball<(RowDataPacket & any)[]>(`SELECT * FROM blockball_league_teams WHERE league_code=? ORDER BY sort_order,id`, [code]);
    const matches = await queryBlockball<(RowDataPacket & any)[]>(`SELECT * FROM blockball_league_matches WHERE league_code=? ORDER BY played_at DESC,id DESC`, [code]);
    const map = new Map(teams.map(t => [t.team_name, { teamId:t.id, teamName:t.team_name, played:t.manual_played, won:t.manual_won, drawn:t.manual_drawn, lost:t.manual_lost, goalsFor:t.manual_goals_for, goalsAgainst:t.manual_goals_against, points:t.manual_points }]));
    for (const m of matches) {
      const a=map.get(m.team1_name), b=map.get(m.team2_name); if(!a||!b) continue;
      a.played++; b.played++; a.goalsFor+=m.score1; a.goalsAgainst+=m.score2; b.goalsFor+=m.score2; b.goalsAgainst+=m.score1;
      if(m.score1>m.score2){a.won++;b.lost++;a.points+=3}else if(m.score2>m.score1){b.won++;a.lost++;b.points+=3}else{a.drawn++;b.drawn++;a.points++;b.points++}
    }
    const standings=[...map.values()].sort((a,b)=>b.points-a.points||(b.goalsFor-b.goalsAgainst)-(a.goalsFor-a.goalsAgainst)||b.goalsFor-a.goalsFor||a.teamName.localeCompare(b.teamName)).map((r,i)=>({...r,position:i+1,goalDifference:r.goalsFor-r.goalsAgainst}));
    const stats = await queryBlockball<(RowDataPacket & any)[]>(`SELECT s.player_uuid uuid,COALESCE(n.name,s.player_name,s.player_uuid) name,s.goals,s.assists,s.saves FROM blockball_league_player_stats s LEFT JOIN player_names n ON n.uuid=s.player_uuid WHERE s.league_code=?`,[code]);
    res.json({ league:code, standings, matches:matches.map(m=>({id:m.id,team1:m.team1_name,team2:m.team2_name,score1:m.score1,score2:m.score2,matchday:m.matchday,playedAt:m.played_at})), leaders:{goals:[...stats].sort((a,b)=>b.goals-a.goals).slice(0,10),assists:[...stats].sort((a,b)=>b.assists-a.assists).slice(0,10),saves:[...stats].sort((a,b)=>b.saves-a.saves).slice(0,10)} });
  } catch(e){next(e)}
});

router.get("/players/resolve/:name", async (req,res,next)=>{try{
  const rows=await queryBlockball<(RowDataPacket & {uuid:string,name:string})[]>(`SELECT uuid,name FROM player_names WHERE LOWER(name)=LOWER(?) ORDER BY last_seen DESC LIMIT 1`,[req.params.name]);
  if(!rows[0]) return res.status(404).json({error:"BLOCKBALL_PLAYER_NOT_FOUND"});
  res.json(rows[0]);
}catch(e){next(e)}});

router.get("/players", async (req,res,next)=>{try{
  const rows=await queryBlockball<(RowDataPacket & any)[]>(`SELECT p.uuid,COALESCE(n.name,p.uuid) name,p.level,p.xp,p.coins FROM players p LEFT JOIN player_names n ON n.uuid=p.uuid ORDER BY p.level DESC,p.xp DESC LIMIT 100`);
  res.json(rows);
}catch(e){next(e)}});

router.get("/players/:uuid", async (req,res,next)=>{try{
  const uuid=String(req.params.uuid).toLowerCase(); if(!uuidPattern.test(uuid)) return res.status(400).json({error:"INVALID_UUID"});
  const rows=await queryBlockball<(RowDataPacket & any)[]>(`SELECT p.uuid,COALESCE(n.name,p.uuid) name,p.level,p.xp,p.coins,p.language,n.last_seen lastSeen FROM players p LEFT JOIN player_names n ON n.uuid=p.uuid WHERE p.uuid=? LIMIT 1`,[uuid]);
  if(!rows[0]) return res.status(404).json({error:"BLOCKBALL_PLAYER_NOT_FOUND"});
  const [casinoRows, cosmetics, active, leagueStats]=await Promise.all([
    queryBlockball<(RowDataPacket & any)[]>(`SELECT daily_plays dailyPlays,daily_bet dailyBet,daily_won dailyWon,daily_lost dailyLost,total_plays totalPlays,total_bet totalBet,total_won totalWon,total_lost totalLost FROM casino_player_stats WHERE uuid=? LIMIT 1`,[uuid]),
    queryBlockball<(RowDataPacket & any)[]>(`SELECT cosmetic_id id FROM player_available_cosmetics WHERE uuid=? ORDER BY cosmetic_id`,[uuid]),
    queryBlockball<(RowDataPacket & any)[]>(`SELECT cosmetic_id id FROM player_active_cosmetics WHERE uuid=? ORDER BY cosmetic_id`,[uuid]),
    queryBlockball<(RowDataPacket & any)[]>(`SELECT league_code league,goals,assists,saves FROM blockball_league_player_stats WHERE player_uuid=? ORDER BY league_code`,[uuid])
  ]);
  res.json({...rows[0],casino:casinoRows[0]||null,cosmetics:cosmetics.map(x=>x.id),activeCosmetics:active.map(x=>x.id),leagueStats});
}catch(e){next(e)}});

export default router;
