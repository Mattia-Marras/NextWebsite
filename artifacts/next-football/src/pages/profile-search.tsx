import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Search,
  Trophy,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  NextFootballApiError,
  resolveNextFootballPlayer,
} from "@/lib/nextfb-api";

function normalizeSearchValue(value: string): string {
  return value.trim();
}

function isValidMinecraftUuid(value: string): boolean {
  const uuidWithoutHyphens = value.replaceAll("-", "");

  return /^[0-9a-f]{32}$/i.test(uuidWithoutHyphens);
}

function isValidMinecraftUsername(value: string): boolean {
  return /^[A-Za-z0-9_]{3,16}$/.test(value);
}

function normalizeUuid(value: string): string {
  const compactUuid = value
    .trim()
    .toLowerCase()
    .replaceAll("-", "");

  return [
    compactUuid.slice(0, 8),
    compactUuid.slice(8, 12),
    compactUuid.slice(12, 16),
    compactUuid.slice(16, 20),
    compactUuid.slice(20),
  ].join("-");
}

function getSearchErrorMessage(error: unknown): string {
  if (error instanceof NextFootballApiError) {
    if (error.code === "MINECRAFT_PLAYER_NOT_FOUND") {
      return "This Minecraft username does not exist.";
    }

    if (error.code === "NEXTFOOTBALL_PLAYER_NOT_FOUND") {
      return "This Minecraft account does not have a NextFootball profile.";
    }

    if (error.code === "INVALID_REQUEST") {
      return error.message;
    }

    if (error.status >= 500) {
      return "The profile service is temporarily unavailable. Please try again.";
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred while searching for the player.";
}

export function ProfileSearch() {
  const [, navigate] = useLocation();

  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSearching) {
      return;
    }

    const normalizedValue =
      normalizeSearchValue(searchValue);

    if (!normalizedValue) {
      setError("Enter a Minecraft username or UUID.");
      return;
    }

    setError(null);

    /*
     * Se il valore è già un UUID valido, non serve interrogare Mojang.
     * Apriamo direttamente la pagina del profilo.
     */
    if (isValidMinecraftUuid(normalizedValue)) {
      const normalizedUuid = normalizeUuid(normalizedValue);

      navigate(
        `/profile/${encodeURIComponent(normalizedUuid)}`,
      );

      return;
    }

    /*
     * Se non è un UUID deve essere uno username Minecraft valido.
     */
    if (!isValidMinecraftUsername(normalizedValue)) {
      setError(
        "Enter a valid Minecraft username or UUID. Usernames must contain 3–16 letters, numbers or underscores.",
      );
      return;
    }

    setIsSearching(true);

    try {
      const player = await resolveNextFootballPlayer(
        normalizedValue,
      );

      navigate(
        `/profile/${encodeURIComponent(player.uuid)}`,
      );
    } catch (searchError) {
      setError(getSearchErrorMessage(searchError));
    } finally {
      setIsSearching(false);
    }
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
          Search by Minecraft username or UUID and explore
          the player&apos;s statistics across every game mode.
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
                  value={searchValue}
                  onChange={(event) => {
                    setSearchValue(event.target.value);

                    if (error) {
                      setError(null);
                    }
                  }}
                  placeholder="Minecraft username or UUID"
                  aria-label="Minecraft username or UUID"
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error
                      ? "profile-search-error"
                      : "profile-search-help"
                  }
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={isSearching}
                  className="h-12 bg-background pl-12 font-mono"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSearching}
                className="h-12 gap-2 border-[#39ff14] bg-[#39ff14] px-7 font-display uppercase tracking-widest text-black hover:bg-[#39ff14]/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSearching ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    View profile
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
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
                Enter a Java Edition username or a Minecraft
                UUID, with or without hyphens.
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
              The same profile data is ready to support global
              and mode-specific leaderboards in the future.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}

