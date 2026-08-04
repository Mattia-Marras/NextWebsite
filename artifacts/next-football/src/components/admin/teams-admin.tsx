import { useState } from "react";
import { useListTeams } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/team-badge";
import { Database, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TeamsAdmin() {
  const [league, setLeague] = useState<"main" | "lower">("main");
  const { data: teams = [], isLoading } = useListTeams({ server: "football", league });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground">Official League Teams</h2>
          <p className="mt-2 text-sm text-muted-foreground">Read directly from the NEXT Football plugin database.</p>
        </div>
        <Select value={league} onValueChange={(value) => setLeague(value as "main" | "lower")}>
          <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="main">Main League</SelectItem>
            <SelectItem value="lower">Lower League</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>Teams are managed by the Minecraft plugin. This panel is intentionally read-only, while fixtures and results can still be entered manually from the Matches tab.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-20">Badge</TableHead>
              <TableHead className="font-display uppercase tracking-widest text-xs">Team</TableHead>
              <TableHead className="font-display uppercase tracking-widest text-xs">Short name</TableHead>
              <TableHead className="font-display uppercase tracking-widest text-xs">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-36" /></TableCell>
              </TableRow>
            )) : teams.length ? teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell><TeamBadge team={team} size="md" /></TableCell>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{team.shortName}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
                    <Database className="h-3.5 w-3.5" /> NEXTFB DB
                  </span>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No official teams found for this league.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
