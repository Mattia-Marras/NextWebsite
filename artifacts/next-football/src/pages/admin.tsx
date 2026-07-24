import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamsAdmin } from "@/components/admin/teams-admin";
import { MatchesAdmin } from "@/components/admin/matches-admin";
import { SettingsAdmin } from "@/components/admin/settings-admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const ADMIN_PASSWORD = "JemchipsyipijeCocaCole";
const SESSION_KEY = "nf_admin_auth";

export function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authed) sessionStorage.setItem(SESSION_KEY, "1");
  }, [authed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setInput("");
    }
  };

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-24 px-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-foreground">Admin Access</h1>
            <p className="text-muted-foreground text-sm">Enter the admin password to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Input
                type="password"
                placeholder="Password"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(false); }}
                className={`bg-background border-border font-mono ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                autoFocus
                data-testid="input-admin-password"
              />
              {error && (
                <p className="text-destructive text-xs font-display uppercase tracking-widest">Incorrect password.</p>
              )}
            </div>
            <Button type="submit" className="w-full font-display uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-admin-login">
              Enter
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 border-b border-border pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-wider flex items-center gap-4">
            <span className="w-4 h-10 bg-primary block rounded-sm"></span>
            League Administration
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl font-sans">
            Manage teams, schedule fixtures, and update match results.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="font-display uppercase tracking-widest text-xs text-muted-foreground border-border hover:text-destructive hover:border-destructive mt-1"
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
          data-testid="button-admin-logout"
        >
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[500px] mb-8 bg-card border border-border">
          <TabsTrigger value="matches" className="font-display uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Matches
          </TabsTrigger>
          <TabsTrigger value="teams" className="font-display uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Teams
          </TabsTrigger>
          <TabsTrigger value="settings" className="font-display uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="matches" className="mt-0">
          <MatchesAdmin />
        </TabsContent>
        <TabsContent value="teams" className="mt-0">
          <TeamsAdmin />
        </TabsContent>
        <TabsContent value="settings" className="mt-0">
          <SettingsAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}
