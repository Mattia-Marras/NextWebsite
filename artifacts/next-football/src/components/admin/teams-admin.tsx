import { useState } from "react";
import { useListTeams, useDeleteTeam, getListTeamsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamBadge } from "@/components/team-badge";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TeamForm } from "./team-form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function TeamsAdmin() {
  const { data: teams, isLoading } = useListTeams();
  const deleteTeam = useDeleteTeam();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this team?")) {
      deleteTeam.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Team deleted successfully" });
            queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
          },
          onError: () => {
            toast({ title: "Failed to delete team", variant: "destructive" });
          }
        }
      );
    }
  };

  const handleEdit = (id: number) => {
    setEditingTeamId(id);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingTeamId(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTeamId(null);
  };

  const groupedTeams = {
    footballMain: teams?.filter(t => t.server === "football" && t.league === "main") || [],
    footballLower: teams?.filter(t => t.server === "football" && t.league === "lower") || [],
    blockballMain: teams?.filter(t => t.server === "blockball" && t.league === "main") || [],
    blockballLower: teams?.filter(t => t.server === "blockball" && t.league === "lower") || [],
  };

  const renderTeamTable = (groupTeams: typeof teams) => (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-8">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-20">Badge</TableHead>
            <TableHead className="font-display uppercase tracking-widest text-xs">Name</TableHead>
            <TableHead className="font-display uppercase tracking-widest text-xs">Short Name</TableHead>
            <TableHead className="font-display uppercase tracking-widest text-xs">Colors</TableHead>
            <TableHead className="text-right font-display uppercase tracking-widest text-xs">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : groupTeams?.length ? (
            groupTeams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>
                  <TeamBadge team={team} size="md" />
                </TableCell>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{team.shortName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: team.primaryColor }}></div>
                    <div className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: team.secondaryColor }}></div>
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(team.id)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(team.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-display uppercase tracking-widest">
                No teams found in this group.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground">Registered Teams</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="font-display uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Add Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-widest text-xl text-primary">
                {editingTeamId ? "Edit Team" : "Create New Team"}
              </DialogTitle>
            </DialogHeader>
            <TeamForm teamId={editingTeamId} onSuccess={closeForm} />
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h3 className="text-xl font-display font-bold uppercase tracking-widest text-primary mb-4">Football - Main League</h3>
        {renderTeamTable(groupedTeams.footballMain)}

        <h3 className="text-xl font-display font-bold uppercase tracking-widest text-primary mb-4">Football - Lower League</h3>
        {renderTeamTable(groupedTeams.footballLower)}

        <h3 className="text-xl font-display font-bold uppercase tracking-widest text-primary mb-4">Blockball - Main League</h3>
        {renderTeamTable(groupedTeams.blockballMain)}

        <h3 className="text-xl font-display font-bold uppercase tracking-widest text-primary mb-4">Blockball - Lower League</h3>
        {renderTeamTable(groupedTeams.blockballLower)}
      </div>
    </div>
  );
}