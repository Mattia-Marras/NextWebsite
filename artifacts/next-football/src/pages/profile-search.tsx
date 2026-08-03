import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Trophy,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function normalizeUuid(value: string): string {
  return value.trim().toLowerCase();
}

function isValidMinecraftUuid(value: string): boolean {
  const uuidWithoutHyphens = value.replaceAll("-", "");

  return /^[0-9a-f]{32}$/i.test(uuidWithoutHyphens);
}

export function ProfileSearch() {
  const [, navigate] = useLocation();

  const [uuid, setUuid] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedUuid = normalizeUuid(uuid);

    if (!normalizedUuid) {
      setError("Enter a player UUID.");
      return;
    }

    if (!isValidMinecraftUuid(normalizedUuid)) {
      setError(
        "Enter a valid Minecraft UUID, with or without hyphens.",
      );
      return;
    }

    setError(null);

    navigate(
      `/profile/${encodeURIComponent(normalizedUuid)}`,
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-background px-4 py-16 md:py-24">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-16 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#39ff14]/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center">
        {/* Back link */}
        <div className="mb-10 flex w-full max-w-2xl justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[#39ff14]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        {/* Header icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#39ff14]/30 bg-[#39ff14]/10 shadow-[0_0_30px_#39ff1420]">
          <UserRound className="h-8 w-8 text-[#39ff14]" />
        </div>

        <p className="mb-3 font-display text-xs uppercase tracking-[0.35em] text-[#39ff14]">
          NextFootball Players
        </p>

        <h1 className="text-center font-display text-4xl font-bold uppercase tracking-tight md:text-6xl">
          Find a player
        </h1>

        <p className="mt-4 max-w-xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
          Search for a NextFootball player and explore their
          statistics across every game mode.
        </p>

        {/* Search form */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 w-full max-w-2xl"
          noValidate
        >
          <div className="rounded-2xl border border-border bg-card/70 p-3 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  type="text"
                  value={uuid}
                  onChange={(event) => {
                    setUuid(event.target.value);

                    if (error) {
                      setError(null);
                    }
                  }}
                  placeholder="Minecraft player UUID"
                  aria-label="Minecraft player UUID"
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error
                      ? "profile-search-error"
                      : "profile-search-help"
                  }
                  autoComplete="off"
                  spellCheck={false}
                  className="h-12 bg-background pl-12 font-mono"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-12 gap-2 border-[#39ff14] bg-[#39ff14] px-7 font-display uppercase tracking-widest text-black hover:bg-[#39ff14]/90"
              >
                View profile
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="min-h-8 px-2 pt-2">
            {error ? (
              <p
                id="profile-search-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ) : (
              <p
                id="profile-search-help"
                className="text-sm text-muted-foreground"
              >
                UUID search is currently supported. Username
                search can be added later.
              </p>
            )}
          </div>
        </form>

        {/* Feature cards */}
        <section className="mt-12 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm transition-colors hover:border-[#39ff14]/30">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#39ff14]/20 bg-[#39ff14]/10">
              <UserRound className="h-5 w-5 text-[#39ff14]" />
            </div>

            <h2 className="font-display text-lg font-bold uppercase">
              Player profiles
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              View level, coins, match statistics, ranked
              progress, league performance, casino activity
              and cosmetics.
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm transition-colors hover:border-amber-400/30">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>

            <h2 className="font-display text-lg font-bold uppercase">
              Leaderboards
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The profile system is structured to support
              global rankings and mode-specific leaderboards
              in the future.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}