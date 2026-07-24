import { useState } from "react";
import { useListMatches, useDeleteMatch, getListMatchesQueryKey, getListRecentMatchesQueryKey, getListUpcomingMatchesQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/team-badge";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MatchForm } from "./match-form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MatchesAdmin() {
  const [filterServer, setFilterServer] = useState<string>("all");
  const [filterLeague, setFilterLeague] = useState<string>("all");

  const queryParams = {
    ...(filterServer !== "all" ? { server: filterServer as "football" | "blockball" } : {}),
    ...(filterLeague !== "all" ? { league: filterLeague as "main" | "lower" } : {})
  };

  const { data: matches, isLoading } = useListMatches(queryParams);
  const deleteMatch = useDeleteMatch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this match?")) {
      deleteMatch.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Match deleted successfully" });
            queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListRecentMatchesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListUpcomingMatchesQueryKey() });
          },
          onError: () => {
            toast({ title: "Failed to delete match", variant: "destructive" });
          }
        }
      );
    }
  };

  const handleEdit = (id: number) => {
    setEditingMatchId(id);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingMatchId(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingMatchId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground">Match Schedule</h2>
        
        <div className="flex items-center gap-4">
          <Select value={filterServer} onValueChange={setFilterServer}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Servers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Servers</SelectItem>
              <SelectItem value="football">Football</SelectItem>
              <SelectItem value="blockball">Blockball</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLeague} onValueChange={setFilterLeague}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Leagues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              <SelectItem value="main">Main League</SelectItem>
              <SelectItem value="lower">Lower League</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate} className="font-display uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display uppercase tracking-widest text-xl text-primary">
                  {editingMatchId ? "Edit Match" : "Schedule New Match"}
                </DialogTitle>
              </DialogHeader>
              <MatchForm matchId={editingMatchId} onSuccess={closeForm} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-display uppercase tracking-widest text-xs">Date</TableHead>
              <TableHead className="font-display uppercase tracking-widest text-xs">Server/League</TableHead>
              <TableHead className="font-display uppercase tracking-widest text-xs">Round</TableHead>
              <TableHead className="font-display uppercase tracking-widest text-xs">Home</TableHead>
              <TableHead className="text-center font-display uppercase tracking-widest text-xs w-24">Score</TableHead>
              <TableHead className="font-display uppercase tracking-widest text-xs">Away</TableHead>
              <TableHead className="font-display uppercase tracking-widest text-xs">Status</TableHead>
              <TableHead className="text-right font-display uppercase tracking-widest text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : matches?.length ? (
              matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{formatDateTime(match.matchDate)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase">{match.server}</span>
                      <span className="text-xs text-muted-foreground uppercase">{match.league}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-display tracking-widest text-xs uppercase">{match.round}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TeamBadge team={match.homeTeam} size="sm" />
                      <span className="font-medium truncate">{match.homeTeam.shortName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-display font-bold text-lg">
                    {match.status === "scheduled" ? "vs" : `${match.homeScore ?? '-'} : ${match.awayScore ?? '-'}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TeamBadge team={match.awayTeam} size="sm" />
                      <span className="font-medium truncate">{match.awayTeam.shortName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {match.status === "live" ? (
                      <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                    ) : match.status === "finished" ? (
                      <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">FT</Badge>
                    ) : (
                      <Badge variant="secondary">Scheduled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(match.id)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(match.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground font-display uppercase tracking-widest">
                  No matches found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}