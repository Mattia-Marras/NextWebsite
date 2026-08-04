import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateMatch,
  useUpdateMatch,
  useGetMatch,
  useListTeams,
  getListMatchesQueryKey,
  getGetMatchQueryKey,
  getListRecentMatchesQueryKey,
  getListUpcomingMatchesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchInputStatus } from "@workspace/api-client-react";
import { ChevronDown, MapPin } from "lucide-react";

const matchSchema = z
  .object({
    homeTeamId: z.coerce.number().min(1, "Select the home team"),
    awayTeamId: z.coerce.number().min(1, "Select the away team"),
    homeScore: z.coerce.number().min(0).nullable().optional(),
    awayScore: z.coerce.number().min(0).nullable().optional(),
    matchDate: z.string().min(1, "Select a date"),
    matchTime: z.string().optional(),
    timeTba: z.boolean(),
    status: z.enum(["scheduled", "live", "finished"]),
    round: z.string().min(1, "Enter the round"),
    venue: z.string().nullable().optional(),
    server: z.literal("football"),
    league: z.enum(["main", "lower"]),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: "Home and away teams cannot be the same",
    path: ["awayTeamId"],
  })
  .refine(
    (data) => data.status === "scheduled" || (data.homeScore !== null && data.homeScore !== undefined),
    { message: "Enter the home score", path: ["homeScore"] },
  )
  .refine(
    (data) => data.status === "scheduled" || (data.awayScore !== null && data.awayScore !== undefined),
    { message: "Enter the away score", path: ["awayScore"] },
  );

type MatchFormValues = z.infer<typeof matchSchema>;

interface MatchFormProps {
  matchId: number | null;
  onSuccess: () => void;
}

function localDateParts(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

export function MatchForm({ matchId, onSuccess }: MatchFormProps) {
  const { data: match, isLoading: isLoadingMatch } = useGetMatch(matchId as number, {
    query: { enabled: !!matchId, queryKey: getGetMatchQueryKey(matchId as number) },
  });

  const today = useMemo(() => localDateParts(new Date()).date, []);
  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      homeTeamId: 0,
      awayTeamId: 0,
      homeScore: null,
      awayScore: null,
      matchDate: today,
      matchTime: "",
      timeTba: true,
      status: "scheduled",
      round: "Round 1",
      venue: "",
      server: "football",
      league: "main",
    },
  });

  const selectedLeague = form.watch("league");
  const selectedStatus = form.watch("status");
  const timeTba = form.watch("timeTba");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: teams = [], isLoading: isLoadingTeams } = useListTeams({
    server: "football",
    league: selectedLeague,
  });

  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (match && initializedForId.current !== match.id) {
      initializedForId.current = match.id;
      const parsed = new Date(match.matchDate);
      const parts = localDateParts(parsed);
      // Matches saved at 12:00 represent a date whose kickoff time is not announced yet.
      const inferredTba = parts.time === "12:00";

      form.reset({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        matchDate: parts.date,
        matchTime: inferredTba ? "" : parts.time,
        timeTba: inferredTba,
        status: match.status as MatchInputStatus,
        round: match.round,
        venue: match.venue || "",
        server: "football",
        league: match.league as "main" | "lower",
      });
      setShowAdvanced(Boolean(match.venue));
    }
  }, [match, form]);

  useEffect(() => {
    if (selectedStatus === "scheduled") {
      form.setValue("homeScore", null);
      form.setValue("awayScore", null);
    }
  }, [selectedStatus, form]);

  const invalidateMatchQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListRecentMatchesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListUpcomingMatchesQueryKey() });
  };

  const onSubmit = (data: MatchFormValues) => {
    // Noon is used as a stable internal placeholder when only the date is known.
    const time = data.timeTba || !data.matchTime ? "12:00" : data.matchTime;
    const localDate = new Date(`${data.matchDate}T${time}:00`);

    const payload = {
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      server: "football" as const,
      league: data.league,
      homeScore: data.status === "scheduled" ? null : data.homeScore,
      awayScore: data.status === "scheduled" ? null : data.awayScore,
      matchDate: localDate.toISOString(),
      status: data.status,
      round: data.round.trim(),
      venue: data.venue?.trim() || null,
    };

    if (matchId) {
      updateMatch.mutate(
        { id: matchId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Match updated" });
            invalidateMatchQueries();
            queryClient.invalidateQueries({ queryKey: getGetMatchQueryKey(matchId) });
            onSuccess();
          },
          onError: () => toast({ title: "Could not update the match", variant: "destructive" }),
        },
      );
      return;
    }

    createMatch.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({ title: "Match scheduled" });
          invalidateMatchQueries();
          onSuccess();
        },
        onError: () => toast({ title: "Could not schedule the match", variant: "destructive" }),
      },
    );
  };

  if (matchId && isLoadingMatch) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm font-medium text-foreground">NEXT Football</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Choose the league, teams and match details.</p>
        </div>

        <FormField
          control={form.control}
          name="league"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-display tracking-widest uppercase">League</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("homeTeamId", 0);
                  form.setValue("awayTeamId", 0);
                }}
                value={field.value}
                disabled={!!matchId}
              >
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select league" /></SelectTrigger>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="homeTeamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Home team</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined} disabled={isLoadingTeams}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder={isLoadingTeams ? "Loading teams..." : "Select team"} /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map((team) => <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>)}
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
                <FormLabel className="font-display tracking-widest uppercase">Away team</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined} disabled={isLoadingTeams}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder={isLoadingTeams ? "Loading teams..." : "Select team"} /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map((team) => <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="matchDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Date</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="matchTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Kickoff time</FormLabel>
                <FormControl><Input type="time" {...field} disabled={timeTba} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="timeTba"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
              <div>
                <FormLabel className="cursor-pointer text-sm font-medium">Kickoff time not announced</FormLabel>
                <p className="mt-0.5 text-xs text-muted-foreground">The public page will show “Time TBA” instead of an incorrect hour.</p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (checked) form.setValue("matchTime", "");
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="round"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Round</FormLabel>
                <FormControl><Input {...field} placeholder="Example: Round 1" /></FormControl>
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
                  <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
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

        {selectedStatus !== "scheduled" && (
          <div className="rounded-lg border border-border bg-muted/15 p-4">
            <p className="mb-3 text-xs font-display uppercase tracking-widest text-muted-foreground">
              {selectedStatus === "live" ? "Current score" : "Final score"}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="homeScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Home</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="awayScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Away</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-muted-foreground" /> Optional details</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>
          {showAdvanced && (
            <div className="border-t border-border p-4">
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue or arena</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} placeholder="Leave empty when not needed" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
          <Button type="submit" disabled={createMatch.isPending || updateMatch.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 font-display uppercase tracking-widest">
            {createMatch.isPending || updateMatch.isPending ? "Saving..." : matchId ? "Save changes" : "Schedule match"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
