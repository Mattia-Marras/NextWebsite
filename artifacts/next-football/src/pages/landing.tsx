import { Link } from "wouter";
import { ArrowRight, Check, Clock3, Layers3 } from "lucide-react";
import logoPath from "@assets/NEXTLogo2_2_1782769726637.png";
import { GAME_MODES } from "@/lib/game-modes";

export function Landing() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(57,255,20,.14),transparent_35%),radial-gradient(circle_at_85%_35%,rgba(56,189,248,.08),transparent_28%)]" />
      <section className="container relative mx-auto px-4 py-12 md:py-18">
        <div className="mx-auto max-w-3xl text-center">
          <img src={logoPath} alt="NEXT" className="mx-auto h-20 w-auto mix-blend-lighten md:h-24" />
          <p className="mt-5 font-display text-xs uppercase tracking-[0.34em] text-[#39ff14]">NEXT Competitive Network</p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight md:text-6xl">Choose your game</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">Each game mode has its own rankings, leagues, players and statistics. Pick one to enter its dedicated area.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
          {GAME_MODES.map((mode) => (
            <article key={mode.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#10161f]/82 p-6 shadow-[0_18px_80px_rgba(0,0,0,.28)] backdrop-blur transition hover:-translate-y-1 hover:border-white/18">
              <div className="absolute inset-x-0 top-0 h-px opacity-90" style={{ background: `linear-gradient(90deg, transparent, ${mode.accent}, transparent)` }} />
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border" style={{ borderColor: `${mode.accent}45`, background: mode.accentSoft, color: mode.accent }}>
                  <Layers3 className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {mode.available ? <><Check className="h-3 w-3" /> Available</> : <><Clock3 className="h-3 w-3" /> Expanding</>}
                </span>
              </div>

              <p className="mt-8 font-display text-xs uppercase tracking-[0.25em]" style={{ color: mode.accent }}>Game mode</p>
              <h2 className="mt-1 font-display text-3xl font-bold uppercase tracking-tight">{mode.name}</h2>
              <p className="mt-3 min-h-12 text-sm leading-relaxed text-muted-foreground">{mode.description}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {mode.sections.map((section) => (
                  <span key={section.label} className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium ${section.available ? "border-white/9 bg-white/4 text-foreground" : "border-white/5 text-muted-foreground/50"}`}>
                    {section.label}
                  </span>
                ))}
              </div>

              {mode.available ? (
                <Link href={mode.landingHref} className="mt-7 flex h-11 items-center justify-between rounded-xl border px-4 font-display text-sm font-bold uppercase tracking-[0.12em] transition hover:bg-white/5" style={{ borderColor: `${mode.accent}55`, color: mode.accent }}>
                  Enter {mode.shortName}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              ) : (
                <div className="mt-7 flex h-11 items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] px-4 font-display text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
                  Dedicated area coming later<Clock3 className="h-4 w-4" />
                </div>
              )}
            </article>
          ))}
        </div>

        <p className="mx-auto mt-7 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">New game modes can be added from one shared configuration without rebuilding the navigation structure.</p>
      </section>
    </div>
  );
}
