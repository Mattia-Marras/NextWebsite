import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamsAdmin } from "@/components/admin/teams-admin";
import { MatchesAdmin } from "@/components/admin/matches-admin";
import { SettingsAdmin } from "@/components/admin/settings-admin";
import { BlockballAdmin } from "@/components/admin/blockball-admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck } from "lucide-react";

export function Admin(){
 const [authed,setAuthed]=useState<boolean|null>(null),[password,setPassword]=useState(""),[error,setError]=useState("");
 useEffect(()=>{fetch('/api/admin/session').then(r=>r.json()).then(v=>setAuthed(Boolean(v.authenticated))).catch(()=>setAuthed(false))},[]);
 const login=async(e:React.FormEvent)=>{e.preventDefault();setError('');const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});if(r.ok){setAuthed(true);setPassword('')}else{const v=await r.json().catch(()=>({}));setError(v.error==='TOO_MANY_ATTEMPTS'?'Too many attempts. Try again later.':'Incorrect password.')}};
 const logout=async()=>{await fetch('/api/admin/logout',{method:'POST'});setAuthed(false)};
 if(authed===null)return <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">Checking secure session…</div>;
 if(!authed)return <div className="flex flex-1 items-center justify-center px-4 py-24"><form onSubmit={login} className="w-full max-w-sm space-y-6 rounded-2xl border bg-card p-8 shadow-2xl"><div className="text-center"><div className="mx-auto mb-3 w-fit rounded-full border border-primary/20 bg-primary/10 p-4"><Lock className="h-8 w-8 text-primary"/></div><h1 className="text-2xl font-display font-bold uppercase tracking-widest">Secure Admin Access</h1><p className="mt-2 text-sm text-muted-foreground">Authentication is verified by the server. The password is never embedded in the website.</p></div><Input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError('')}} placeholder="Admin password" autoFocus/>{error&&<p className="text-xs text-destructive">{error}</p>}<Button className="w-full" type="submit">Sign in</Button></form></div>;
 return <div className="container mx-auto px-4 py-12"><div className="mb-8 flex items-start justify-between border-b pb-6"><div><h1 className="flex items-center gap-3 text-4xl font-display font-bold uppercase tracking-wider"><ShieldCheck className="h-9 w-9 text-primary"/>Administration</h1><p className="mt-2 text-muted-foreground">NEXT Football and NEXT BlockBall are managed in separate workspaces and databases.</p></div><Button variant="outline" onClick={logout}>Sign out</Button></div>
 <Tabs defaultValue="blockball"><TabsList className="mb-8 grid h-auto w-full max-w-2xl grid-cols-2 p-1"><TabsTrigger value="football" className="py-3">NEXT Football</TabsTrigger><TabsTrigger value="blockball" className="py-3">NEXT BlockBall</TabsTrigger></TabsList>
 <TabsContent value="football"><div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5"><h2 className="text-2xl font-display font-bold uppercase tracking-widest">NEXT Football Administration</h2><p className="mt-1 text-sm text-muted-foreground">Uses only the official NEXT Football competition database.</p></div><Tabs defaultValue="matches"><TabsList><TabsTrigger value="matches">Football Matches</TabsTrigger><TabsTrigger value="teams">Football Teams</TabsTrigger><TabsTrigger value="settings">Football Settings</TabsTrigger></TabsList><TabsContent value="matches"><MatchesAdmin/></TabsContent><TabsContent value="teams"><TeamsAdmin/></TabsContent><TabsContent value="settings"><SettingsAdmin/></TabsContent></Tabs></TabsContent>
 <TabsContent value="blockball"><BlockballAdmin/></TabsContent></Tabs></div>
}
