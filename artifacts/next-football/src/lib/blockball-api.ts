const BASE="/api/blockball";
async function get<T>(url:string):Promise<T>{const r=await fetch(`${BASE}${url}`);if(!r.ok)throw new Error((await r.json().catch(()=>null))?.error||`HTTP ${r.status}`);return r.json()}
export type BBLeague="ML"|"LL";
export const getBlockballLeague=(l:BBLeague)=>get<any>(`/league/${l}`);
export const getBlockballPlayers=()=>get<any[]>(`/players`);
export const getBlockballPlayer=(uuid:string)=>get<any>(`/players/${encodeURIComponent(uuid)}`);
export const resolveBlockballPlayer=(name:string)=>get<{uuid:string,name:string}>(`/players/resolve/${encodeURIComponent(name)}`);
