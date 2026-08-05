import { Link } from "wouter";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Gamepad2,
  MessageCircle,
  Server,
  Trophy,
  Youtube,
} from "lucide-react";
import logoPath from "@assets/NEXTLogo2_2_1782769726637.png";
import { GAME_MODES } from "@/lib/game-modes";
import { useGetSettings } from "@workspace/api-client-react";
import { useState } from "react";

const DEFAULT_MINECRAFT_IP = "play.nextfootball.net";
const DEFAULT_DISCORD_URL = "https://discord.gg/nqhjCx7qY";
const DEFAULT_YOUTUBE_URL = "https://www.youtube.com/@NEXTFootballOfficial";

function CopyServerIp({ ip }: { ip: string }) {
  const [copied, setCopied] = useState(false);

  const copyIp = async () => {
    await navigator.clipboard.writeText(ip);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={copyIp}
      className="group flex min-h-12 w-full items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 text-left transition hover:border-[#39ff14]/45 hover:bg-white/[0.04]"
      aria-label={`Copy Minecraft server IP ${ip}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#39ff14]/25 bg-[#39ff14]/10 text-[#39ff14]">
        <Server className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Play now</span>
        <span className="mt-0.5 block truncate font-mono text-sm font-semibold text-white sm:text-base">{ip}</span>
      </span>
      <span className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition group-hover:text-[#39ff14]">
        {copied ? "Copied" : "Copy"}
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </span>
    </button>
  );
}

function CommunityLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      {icon}
      <span className="font-display text-xs font-bold uppercase tracking-[0.12em]">{label}</span>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-white" />
    </a>
  );
}

function GameCard({ mode }: { mode: (typeof GAME_MODES)[number] }) {
  const availableSections = mode.sections.filter((section) => section.available);
  const isFootball = mode.id === "football";

  return (
    <Link
      href={mode.landingHref}
      className="group relative flex min-h-[330px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#10161f]/84 p-6 shadow-[0_18px_80px_rgba(0,0,0,.28)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2"
      style={{ "--card-accent": mode.accent } as React.CSSProperties}
    >
      <div className="absolute inset-x-0 top-0 h-px opacity-90" style={{ background: `linear-gradient(90deg, transparent, ${mode.accent}, transparent)` }} />
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full opacity-0 blur-3xl transition duration-500 group-hover:opacity-20"
        style={{ background: mode.accent }}
      />

      <div className="flex items-start justify-between gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl border transition duration-300 group-hover:scale-105"
          style={{ borderColor: `${mode.accent}55`, background: mode.accentSoft, color: mode.accent }}
        >
          {isFootball ? <Trophy className="h-6 w-6" /> : <Gamepad2 className="h-6 w-6" />}
        </div>
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Competitive mode
        </span>
      </div>

      <p className="mt-7 font-display text-xs uppercase tracking-[0.25em]" style={{ color: mode.accent }}>
        {isFootball ? "Football ecosystem" : "Blockball ecosystem"}
      </p>
      <h2 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight">{mode.name}</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{mode.description}</p>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
        {availableSections.map((section, index) => (
          <span key={section.label} className="flex items-center gap-3">
            {index > 0 && <span className="h-1 w-1 rounded-full bg-white/25" />}
            {section.label}
          </span>
        ))}
        {mode.sections.some((section) => !section.available) && (
          <span className="flex items-center gap-3 text-muted-foreground/60">
            <span className="h-1 w-1 rounded-full bg-white/20" /> More coming later
          </span>
        )}
      </div>

      <div
        className="mt-auto flex h-12 items-center justify-between rounded-xl border px-4 font-display text-sm font-bold uppercase tracking-[0.12em] transition duration-300 group-hover:bg-white/[0.05]"
        style={{ borderColor: `${mode.accent}55`, color: mode.accent }}
      >
        Enter {mode.shortName}
        <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1.5" />
      </div>
    </Link>
  );
}

export function Landing() {
  const { data: settings } = useGetSettings();
  const minecraftIp = settings?.minecraftIp || DEFAULT_MINECRAFT_IP;
  const discordUrl = settings?.discordUrl || DEFAULT_DISCORD_URL;
  const youtubeUrl = settings?.youtubeUrl || DEFAULT_YOUTUBE_URL;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(57,255,20,.14),transparent_35%),radial-gradient(circle_at_85%_35%,rgba(56,189,248,.08),transparent_28%)]" />
      <section className="container relative mx-auto px-4 py-8 md:py-11">
        <div className="mx-auto max-w-3xl text-center">
          <img src={logoPath} alt="NEXT" className="mx-auto h-16 w-auto mix-blend-lighten md:h-20" />
          <p className="mt-4 font-display text-[10px] uppercase tracking-[0.34em] text-[#39ff14] md:text-xs">NEXT Competitive Network</p>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight md:text-5xl">Choose your game</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Select the competitive ecosystem you want to explore.
          </p>
        </div>

        <div className="mx-auto mt-6 grid max-w-5xl gap-3 rounded-2xl border border-white/10 bg-[#10161f]/75 p-3 shadow-[0_18px_80px_rgba(0,0,0,.22)] backdrop-blur md:grid-cols-[1.45fr_.72fr_.72fr]">
          <CopyServerIp ip={minecraftIp} />
          <CommunityLink href={discordUrl} label="Discord" icon={<MessageCircle className="h-4 w-4" />} />
          <CommunityLink href={youtubeUrl} label="YouTube" icon={<Youtube className="h-4 w-4" />} />
        </div>

        <div className="mx-auto mt-7 grid max-w-5xl gap-5 md:grid-cols-2">
          {GAME_MODES.filter((mode) => mode.available).map((mode) => (
            <GameCard key={mode.id} mode={mode} />
          ))}
        </div>
      </section>
    </div>
  );
}
