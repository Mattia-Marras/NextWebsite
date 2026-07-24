import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTeam, useUpdateTeam, useGetTeam, getListTeamsQueryKey, getGetTeamQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamInputServer, TeamInputLeague } from "@workspace/api-client-react";

const teamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().min(1, "Short name is required").max(4, "Max 4 characters"),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  logoInitials: z.string().min(1, "Initials required").max(3, "Max 3 characters"),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional().nullable(),
  server: z.enum(["football", "blockball"]),
  league: z.enum(["main", "lower"]),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamFormProps {
  teamId: number | null;
  onSuccess: () => void;
}

export function TeamForm({ teamId, onSuccess }: TeamFormProps) {
  const { data: team, isLoading } = useGetTeam(teamId as number, { query: { enabled: !!teamId, queryKey: getGetTeamQueryKey(teamId as number) } });
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      shortName: "",
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      logoInitials: "",
      logoUrl: "",
      server: "football",
      league: "main",
    },
  });

  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (team && initializedForId.current !== team.id) {
      initializedForId.current = team.id;
      form.reset({
        name: team.name,
        shortName: team.shortName,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        logoInitials: team.logoInitials,
        logoUrl: team.logoUrl || "",
        server: team.server as "football" | "blockball",
        league: team.league as "main" | "lower",
      });
    }
  }, [team, form]);

  const onSubmit = (data: TeamFormValues) => {
    const payload = {
      ...data,
      logoUrl: data.logoUrl || null,
    };

    if (teamId) {
      updateTeam.mutate(
        { id: teamId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Team updated successfully" });
            queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetTeamQueryKey(teamId) });
            onSuccess();
          },
          onError: () => {
            toast({ title: "Failed to update team", variant: "destructive" });
          }
        }
      );
    } else {
      createTeam.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Team created successfully" });
            queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
            onSuccess();
          },
          onError: () => {
            toast({ title: "Failed to create team", variant: "destructive" });
          }
        }
      );
    }
  };

  if (teamId && isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                <Select onValueChange={field.onChange} value={field.value}>
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

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-display tracking-widest uppercase">Team Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="shortName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Short Name</FormLabel>
                <FormControl>
                  <Input {...field} maxLength={4} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logoInitials"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Initials</FormLabel>
                <FormControl>
                  <Input {...field} maxLength={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-display tracking-widest uppercase">Logo URL (Optional)</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input {...field} value={field.value || ""} placeholder="https://..." />
                  {field.value && (
                    <div className="w-10 h-10 shrink-0 border border-border rounded overflow-hidden">
                      <img src={field.value} alt="Preview" className="w-full h-full object-contain" onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }} />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="primaryColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Primary Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input type="color" {...field} className="w-12 p-1" />
                    <Input {...field} className="flex-1 font-mono uppercase" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="secondaryColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-display tracking-widest uppercase">Secondary Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input type="color" {...field} className="w-12 p-1" />
                    <Input {...field} className="flex-1 font-mono uppercase" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
          <Button type="submit" disabled={createTeam.isPending || updateTeam.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 font-display uppercase tracking-widest">
            {createTeam.isPending || updateTeam.isPending ? "Saving..." : "Save Team"}
          </Button>
        </div>
      </form>
    </Form>
  );
}