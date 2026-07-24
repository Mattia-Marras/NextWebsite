import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateMatch, useUpdateMatch, useGetMatch, useListTeams, getListMatchesQueryKey, getGetMatchQueryKey, getListRecentMatchesQueryKey, getListUpcomingMatchesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchInputStatus } from "@workspace/api-client-react";

const matchSchema = z.object({
  homeTeamId: z.coerce.number().min(1, "Home team required"),
  awayTeamId: z.coerce.number().min(1, "Away team required"),
  homeScore: z.coerce.number().nullable().optional(),
  awayScore: z.coerce.number().nullable().optional(),
  matchDate: z.string().min(1, "Date required"),
  status: z.enum(["scheduled", "live", "finished"]),
  round: z.string().min(1, "Round required"),
  venue: z.string().nullable().optional(),
  server: z.enum(["football", "blockball"]),
  league: z.enum(["main", "lower"]),
}).refine(data => data.homeTeamId !== data.awayTeamId, {
  message: "Home and away teams cannot be the same",
  path: ["awayTeamId"],
});

type MatchFormValues = z.infer<typeof matchSchema>;

interface MatchFormProps {
  matchId: number | null;
  onSuccess: () => void;
}

export function MatchForm({ matchId, onSuccess }: MatchFormProps) {
  const { data: match, isLoading: isLoadingMatch } = useGetMatch(matchId as number, { query: { enabled: !!matchId, queryKey: getGetMatchQueryKey(matchId as number) } });
  
  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      homeTeamId: 0,
      awayTeamId: 0,
      homeScore: null,
      awayScore: null,
      matchDate: new Date().toISOString().slice(0, 16),
      status: "scheduled",
      round: "Round 1",
      venue: "",
      server: "football",
      league: "main",
    },
  });

  const selectedServer = form.watch("server");
  const selectedLeague = form.watch("league");

  const { data: teams = [], isLoading: isLoadingTeams } = useListTeams({ server: selectedServer, league: selectedLeague });
  
  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (match && initializedForId.current !== match.id) {
      initializedForId.current = match.id;
      // Convert matchDate to local datetime-local format string
      let formattedDate = "";
      try {
        const d = new Date(match.matchDate);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        formattedDate = d.toISOString().slice(0, 16);
      } catch (e) {
        formattedDate = match.matchDate.slice(0, 16);
      }
      
      form.reset({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        matchDate: formattedDate,
        status: match.status as MatchInputStatus,
        round: match.round,
        venue: match.venue || "",
        server: match.server as "football" | "blockball",
        league: match.league as "main" | "lower",
      });
    }
  }, [match, form]);

  const onSubmit = (data: MatchFormValues) => {
    // Format date back to ISO string if needed
    const payload = {
      ...data,
      matchDate: new Date(data.matchDate).toISOString(),
    };

    if (matchId) {
      updateMatch.mutate(
        { id: matchId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Match updated successfully" });
            queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetMatchQueryKey(matchId) });
            queryClient.invalidateQueries({ queryKey: getListRecentMatchesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListUpcomingMatchesQueryKey() });
            onSuccess();
          },
          onError: () => {
            toast({ title: "Failed to update match", variant: "destructive" });
          }
        }
      );
    } else {
      createMatch.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Match scheduled successfully" });
            queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListRecentMatchesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListUpcomingMatchesQueryKey() });
            onSuccess();
          },
          onError: () => {
            toast({ title: "Failed to schedule match", variant: "destructive" });
          }
        }
      );
    }
  };

  if ((matchId && isLoadingMatch)) {
    return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="server"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Server</FormLabel>
                <Select onValueChange={(val) => {
                  field.onChange(val);
                  form.setValue("homeTeamId", 0);
                  form.setValue("awayTeamId", 0);
                }} value={field.value} disabled={!!matchId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Server" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="football">Football</SelectItem>
                    <SelectItem value="blockball">Blockball</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="league"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">League</FormLabel>
                <Select onValueChange={(val) => {
                  field.onChange(val);
                  form.setValue("homeTeamId", 0);
                  form.setValue("awayTeamId", 0);
                }} value={field.value} disabled={!!matchId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select League" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="main">Main League</SelectItem>
                    <SelectItem value="lower">Lower League</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="homeTeamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Home Team</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined} disabled={isLoadingTeams}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingTeams ? "Loading teams..." : "Select team"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="awayTeamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Away Team</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined} disabled={isLoadingTeams}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingTeams ? "Loading teams..." : "Select team"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="homeScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Home Score</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="awayScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Away Score</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="matchDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="round"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Round</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Venue (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
          <Button type="submit" disabled={createMatch.isPending || updateMatch.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 font-display uppercase tracking-widest">
            {createMatch.isPending || updateMatch.isPending ? "Saving..." : "Save Match"}
          </Button>
        </div>
      </form>
    </Form>
  );
}