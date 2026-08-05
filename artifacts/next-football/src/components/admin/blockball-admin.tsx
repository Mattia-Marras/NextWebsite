import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Team={id:number;team_name:string;team_code:string|null};
type Match={id:number;team1_name:string;team2_name:string;score1:number;score2:number;matchday:number|null;played_at:string};
async function api<T>(url:string, init?:RequestInit):Promise<T>{
 const r=await fetch(url,{...init,headers:{"Content-Type":"application/json",...(init?.headers||{})}});
 if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||`Request failed (${r.status})`)}
 return r.status===204?undefined as T:r.json();
}
export function BlockballAdmin(){
 const [league,setLeague]=useState("ML"),[teams,setTeams]=useState<Team[]>([]),[matches,setMatches]=useState<Match[]>([]);
 const [name,setName]=useState(""),[t1,setT1]=useState(""),[t2,setT2]=useState(""),[s1,setS1]=useState("0"),[s2,setS2]=useState("0"),[day,setDay]=useState("");
 const {toast}=useToast();
 const load=async()=>{try{const [a,b]=await Promise.all([api<Team[]>(`/api/admin/blockball/teams?league=${league}`),api<Match[]>(`/api/admin/blockball/matches?league=${league}`)]);setTeams(a);setMatches(b)}catch(e:any){toast({title:e.message,variant:"destructive"})}};
 useEffect(()=>{void load()},[league]);
 const addTeam=async()=>{try{await api('/api/admin/blockball/teams',{method:'POST',body:JSON.stringify({league,name})});setName('');await load()}catch(e:any){toast({title:e.message,variant:'destructive'})}};
 const rename=async(t:Team)=>{const n=prompt('New team name',t.team_name)?.trim();if(!n)return;try{await api(`/api/admin/blockball/teams/${t.id}`,{method:'PATCH',body:JSON.stringify({name:n})});await load()}catch(e:any){toast({title:e.message,variant:'destructive'})}};
 const delTeam=async(t:Team)=>{if(!confirm(`Delete ${t.team_name}? Remove its matches first.`))return;try{await api(`/api/admin/blockball/teams/${t.id}`,{method:'DELETE'});await load()}catch(e:any){toast({title:e.message,variant:'destructive'})}};
 const addMatch=async()=>{try{await api('/api/admin/blockball/matches',{method:'POST',body:JSON.stringify({league,team1Id:Number(t1),team2Id:Number(t2),score1:Number(s1),score2:Number(s2),matchday:day?Number(day):null})});setT1('');setT2('');setS1('0');setS2('0');setDay('');await load()}catch(e:any){toast({title:e.message,variant:'destructive'})}};
 const editMatch=async(m:Match)=>{const a=prompt('Team 1 score',String(m.score1));if(a===null)return;const b=prompt('Team 2 score',String(m.score2));if(b===null)return;try{await api(`/api/admin/blockball/matches/${m.id}`,{method:'PATCH',body:JSON.stringify({score1:Number(a),score2:Number(b),matchday:m.matchday})});await load()}catch(e:any){toast({title:e.message,variant:'destructive'})}};
 const delMatch=async(id:number)=>{if(!confirm('Delete this BlockBall match?'))return;try{await api(`/api/admin/blockball/matches/${id}`,{method:'DELETE'});await load()}catch(e:any){toast({title:e.message,variant:'destructive'})}};
 return <div className="space-y-6">
  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"><h2 className="text-2xl font-display font-bold uppercase tracking-widest">NEXT BlockBall Administration</h2><p className="mt-1 text-sm text-muted-foreground">Manage only the BlockBall Major League and Lower League database.</p></div>
  <Select value={league} onValueChange={setLeague}><SelectTrigger className="w-56"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ML">Major League (ML)</SelectItem><SelectItem value="LL">Lower League (LL)</SelectItem></SelectContent></Select>
  <Tabs defaultValue="matches"><TabsList><TabsTrigger value="matches">BlockBall Matches</TabsTrigger><TabsTrigger value="teams">BlockBall Teams</TabsTrigger></TabsList>
   <TabsContent value="teams" className="space-y-4"><div className="flex gap-2"><Input value={name} onChange={e=>setName(e.target.value)} placeholder="New BlockBall team name"/><Button onClick={addTeam} disabled={!name.trim()}><Plus className="mr-2 h-4 w-4"/>Add team</Button></div><div className="rounded-xl border"><Table><TableHeader><TableRow><TableHead>Team</TableHead><TableHead>Code</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{teams.map(t=><TableRow key={t.id}><TableCell className="font-semibold">{t.team_name}</TableCell><TableCell>{t.team_code||'—'}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" onClick={()=>rename(t)}><Pencil className="h-4 w-4"/></Button> <Button variant="destructive" size="sm" onClick={()=>delTeam(t)}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>)}</TableBody></Table></div></TabsContent>
   <TabsContent value="matches" className="space-y-4"><div className="grid gap-3 rounded-xl border p-4 md:grid-cols-6"><Select value={t1} onValueChange={setT1}><SelectTrigger><SelectValue placeholder="Team 1"/></SelectTrigger><SelectContent>{teams.map(t=><SelectItem key={t.id} value={String(t.id)}>{t.team_name}</SelectItem>)}</SelectContent></Select><Input type="number" min="0" value={s1} onChange={e=>setS1(e.target.value)} placeholder="Score 1"/><Select value={t2} onValueChange={setT2}><SelectTrigger><SelectValue placeholder="Team 2"/></SelectTrigger><SelectContent>{teams.map(t=><SelectItem key={t.id} value={String(t.id)}>{t.team_name}</SelectItem>)}</SelectContent></Select><Input type="number" min="0" value={s2} onChange={e=>setS2(e.target.value)} placeholder="Score 2"/><Input type="number" min="1" value={day} onChange={e=>setDay(e.target.value)} placeholder="Matchday"/><Button onClick={addMatch} disabled={!t1||!t2||t1===t2}><Plus className="mr-2 h-4 w-4"/>Add result</Button></div><div className="rounded-xl border"><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Matchday</TableHead><TableHead>Result</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{matches.map(m=><TableRow key={m.id}><TableCell>#{m.id}</TableCell><TableCell>{m.matchday??'—'}</TableCell><TableCell className="font-semibold">{m.team1_name} {m.score1}–{m.score2} {m.team2_name}</TableCell><TableCell>{m.played_at?new Date(m.played_at).toLocaleString():'—'}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" onClick={()=>editMatch(m)}><Pencil className="h-4 w-4"/></Button> <Button variant="destructive" size="sm" onClick={()=>delMatch(m.id)}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>)}</TableBody></Table></div></TabsContent>
  </Tabs>
 </div>
}
