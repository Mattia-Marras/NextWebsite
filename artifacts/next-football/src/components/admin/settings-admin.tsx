import { useState, useEffect, useCallback } from "react";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Server, Hash, Youtube, Database, CheckCircle2, XCircle, Loader2, Unplug } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type DbStatus = {
  hasCustom: boolean;
  maskedUrl: string | null;
  isCustomActive: boolean;
};

function useDbStatus() {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(() => {
    setLoading(true);
    fetch(`${BASE}/api/database/status`)
      .then((r) => r.json() as Promise<DbStatus>)
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { status, loading, refetch: fetch_ };
}

function DatabaseSection() {
  const { status, loading: statusLoading, refetch } = useDbStatus();
  const { toast } = useToast();

  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [restarting, setRestarting] = useState(false);

  // Poll healthz until the server comes back after a restart
  const waitForRestart = useCallback(() => {
    setRestarting(true);
    const poll = () => {
      fetch(`${BASE}/api/healthz`)
        .then((r) => {
          if (r.ok) {
            setRestarting(false);
            refetch();
            toast({ title: "Database connected", description: "Server restarted with the new database." });
          } else {
            setTimeout(poll, 1500);
          }
        })
        .catch(() => setTimeout(poll, 1500));
    };
    setTimeout(poll, 1500);
  }, [refetch, toast]);

  const handleTest = async () => {
    if (!url.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const r = await fetch(`${BASE}/api/database/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await r.json() as { ok: boolean; error?: string };
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, error: "Could not reach the server." });
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    if (!url.trim()) return;
    setConnecting(true);
    setTestResult(null);
    try {
      const r = await fetch(`${BASE}/api/database/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await r.json() as { ok: boolean; error?: string };
      if (!data.ok) {
        toast({ title: "Connection failed", description: data.error ?? "Unknown error.", variant: "destructive" });
        setConnecting(false);
        return;
      }
      setUrl("");
      waitForRestart();
    } catch {
      toast({ title: "Error", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch(`${BASE}/api/database/custom`, { method: "DELETE" });
      waitForRestart();
    } catch {
      toast({ title: "Error", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="font-display font-bold uppercase tracking-widest text-sm text-foreground flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Database Connection
        </h3>
        <p className="text-xs text-muted-foreground">
          Connect your own PostgreSQL database. The server will restart automatically when you switch.
        </p>
      </div>

      {/* Current status */}
      {restarting ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Restarting server…
        </div>
      ) : statusLoading ? (
        <div className="text-xs text-muted-foreground animate-pulse">Loading…</div>
      ) : status ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span className="font-mono text-muted-foreground truncate max-w-xs">
              {status.maskedUrl ?? "No URL configured"}
            </span>
            {status.isCustomActive && (
              <span className="ml-auto shrink-0 text-[10px] font-display uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Custom
              </span>
            )}
          </div>
          {status.hasCustom && (
            <Button
              variant="outline"
              size="sm"
              className="self-start font-display uppercase tracking-widest text-xs text-destructive border-destructive/40 hover:bg-destructive/10 hover:border-destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              <Unplug className="w-3 h-3 mr-1" />
              {disconnecting ? "Removing…" : "Remove Custom DB"}
            </Button>
          )}
        </div>
      ) : null}

      {/* New connection form */}
      <div className="flex flex-col gap-3 pt-1 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Paste a PostgreSQL connection string to switch databases:
        </p>
        <Input
          type="password"
          className="bg-background border-border font-mono text-sm"
          placeholder="postgresql://user:password@host:5432/dbname"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setTestResult(null); }}
        />

        {testResult && (
          <div className={`flex items-center gap-2 text-xs font-display ${testResult.ok ? "text-primary" : "text-destructive"}`}>
            {testResult.ok
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Connection successful</>
              : <><XCircle className="w-3.5 h-3.5" /> {testResult.error}</>
            }
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-display uppercase tracking-widest text-xs"
            onClick={handleTest}
            disabled={!url.trim() || testing || connecting}
          >
            {testing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            {testing ? "Testing…" : "Test"}
          </Button>
          <Button
            size="sm"
            className="font-display uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleConnect}
            disabled={!url.trim() || connecting || testing}
          >
            {connecting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            {connecting ? "Connecting…" : "Save & Connect"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SettingsAdmin() {
  const { data: settings, isLoading } = useGetSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettings();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [minecraftIp, setMinecraftIp] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  useEffect(() => {
    if (settings) {
      setMinecraftIp(settings.minecraftIp ?? "");
      setDiscordUrl(settings.discordUrl ?? "");
      setYoutubeUrl(settings.youtubeUrl ?? "");
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        data: {
          minecraftIp: minecraftIp || null,
          discordUrl: discordUrl || null,
          youtubeUrl: youtubeUrl || null,
        },
      });
      await qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      toast({ title: "Settings saved", description: "Homepage info updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="text-muted-foreground text-sm animate-pulse">Loading settings…</div>;

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            Minecraft Server IP
          </h3>
          <p className="text-xs text-muted-foreground">Shown on the homepage with a copy button. Leave blank to hide.</p>
          <Input
            className="mt-2 bg-background border-border font-mono"
            placeholder="e.g. play.nextfootball.net"
            value={minecraftIp}
            onChange={e => setMinecraftIp(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm text-foreground flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" />
            Discord Invite URL
          </h3>
          <p className="text-xs text-muted-foreground">Full Discord invite link. Shown as a "Join Discord" button. Leave blank to hide.</p>
          <Input
            className="mt-2 bg-background border-border"
            placeholder="e.g. https://discord.gg/abc123"
            value={discordUrl}
            onChange={e => setDiscordUrl(e.target.value)}
            type="url"
          />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm text-foreground flex items-center gap-2">
            <Youtube className="w-4 h-4 text-primary" />
            YouTube Channel URL
          </h3>
          <p className="text-xs text-muted-foreground">Full YouTube channel link. Shown on the homepage. Leave blank to hide.</p>
          <Input
            className="mt-2 bg-background border-border"
            placeholder="e.g. https://www.youtube.com/@NEXTFootballOfficial"
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            type="url"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={isPending}
          className="self-start font-display uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
