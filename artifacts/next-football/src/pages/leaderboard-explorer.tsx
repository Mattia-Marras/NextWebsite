import { numberFormatter, translate, useLanguage } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Mode = "football" | "blockball";
const CATEGORIES: Record<string, string> = {
  ranked: "Ranked",
  league: "League",
  economy: "Economy",
  gamebet: "GameBet",
  ut: "Ultimate Team",
  progression: "Progression",
  classic: "Classic",
};
export const BOARD_METRICS: Record<string, Record<string, string>> = {
  ranked: {
    mmr: "MMR",
    wins: "Wins",
    matches: "Matches",
    goals: "Goals",
    assists: "Assists",
    saves: "Saves",
    passes: "Passes",
    winRate: "Win rate",
    goalsPerMatch: "Goals / match",
    assistsPerMatch: "Assists / match",
    savesPerMatch: "Saves / match",
  },
  league: {
    goals: "Goals",
    assists: "Assists",
    saves: "Saves",
    matches: "Matches",
    goalsPerMatch: "Goals / match",
    assistsPerMatch: "Assists / match",
    savesPerMatch: "Saves / match",
  },
  economy: { coins: "Coin balance" },
  gamebet: {
    net: "Net winnings",
    staked: "Total staked",
    won: "Total won",
    lost: "Total lost",
    plays: "Bets played",
  },
  ut: {
    uniqueCards: "Unique cards",
    copies: "Total copies",
    completion: "Collection completion",
  },
  progression: { level: "Level", xp: "Experience" },
  classic: {
    goals: "Goals",
    assists: "Assists",
    saves: "Saves",
    passes: "Passes",
    matches: "Matches",
  },
};
const DETAILS: Record<string, string> = {
  ranked:
    "Current Ranked records. A minimum match count applies to percentages and per-match averages.",
  league:
    "Compare one competition and season at a time. Historical seasons remain separate from current records.",
  economy: "Current coin balances. Balances are not lifetime earnings.",
  gamebet:
    "Lifetime GameBet records. Net winnings = total won − total lost, matching the player profile counters.",
  ut: "Unique cards count distinct card IDs with positive ownership. Completion compares those IDs with the selected catalogue; duplicates increase total copies only.",
  progression: "Account level and accumulated experience.",
  classic:
    "Classic gameplay records. These statistics are separate from Ranked.",
};
const COLUMNS: Record<string, string[]> = {
  ranked: ["mmr", "matches", "wins", "losses"],
  league: ["matches", "goals", "assists", "saves"],
  economy: [],
  gamebet: ["won", "lost", "staked", "plays"],
  ut: ["uniqueCards", "copies", "catalogue"],
  progression: ["level", "xp"],
  classic: ["matches", "goals", "assists", "saves"],
};
const LABELS: Record<string, string> = {
  mmr: "MMR",
  matches: "Matches",
  wins: "Wins",
  losses: "Losses",
  goals: "Goals",
  assists: "Assists",
  saves: "Saves",
  won: "Won",
  lost: "Lost",
  staked: "Staked",
  plays: "Bets",
  uniqueCards: "Unique cards",
  copies: "Copies",
  catalogue: "Catalogue",
  level: "Level",
  xp: "XP",
};
interface BoardRow {
  uuid: string;
  name: string | null;
  position: number;
  value: number | null;
  [key: string]: number | string | null;
}
interface BoardResult {
  category: string;
  metric: string;
  league: string;
  season: string;
  seasons: string[];
  minMatches: number;
  total: number;
  limit: number;
  offset: number;
  data: BoardRow[];
}
const number = (value: unknown, decimals = 0) =>
  value == null
    ? "—"
    : numberFormatter("en-US", {
        maximumFractionDigits: decimals,
      }).format(Number(value));
export function LeaderboardExplorer({ mode }: { mode: Mode }) {
  useLanguage();
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const legacy = params.get("tab");
  const legacyCategory =
    legacy === "coins"
      ? "economy"
      : legacy === "level"
        ? "progression"
        : legacy === "casino"
          ? "gamebet"
          : ["goals", "assists", "saves"].includes(legacy ?? "") &&
              mode === "football"
            ? "classic"
            : "ranked";
  const requested = params.get("category") ?? legacyCategory;
  const category =
    Object.hasOwn(CATEGORIES, requested) &&
    !(mode === "blockball" && requested === "classic")
      ? requested
      : "ranked";
  const metrics = BOARD_METRICS[category];
  const candidate =
    params.get("metric") ?? (legacy === "casino" ? "won" : (legacy ?? ""));
  const metric = Object.hasOwn(metrics, candidate)
    ? candidate
    : Object.keys(metrics)[0];
  const rate = metric === "winRate" || metric.endsWith("PerMatch");
  const minRaw = Number(params.get("minMatches") ?? (rate ? 20 : 0));
  const minMatches = Number.isFinite(minRaw)
    ? Math.max(rate ? 1 : 0, Math.min(1000000, Math.floor(minRaw)))
    : rate
      ? 20
      : 0;
  const pageRaw = Number(params.get("page") ?? 1);
  const page = Number.isFinite(pageRaw)
    ? Math.max(1, Math.min(400001, Math.floor(pageRaw)))
    : 1;
  const league = params.get("league") === "LL" ? "LL" : "ML";
  const season = params.get("season") ?? "";
  const sample = ["ranked", "league", "classic"].includes(category);
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(search);
    next.delete("tab");
    next.set("category", category);
    next.set("metric", metric);
    next.delete("page");
    for (const [key, value] of Object.entries(patch)) {
      if (value == null) next.delete(key);
      else next.set(key, value);
    }
    navigate(`/${mode}/leaderboards?${next.toString()}`);
  };
  const query = useQuery({
    queryKey: [
      "leaderboard-explorer",
      mode,
      category,
      metric,
      minMatches,
      league,
      season,
      page,
    ],
    queryFn: async ({ signal }) => {
      const filter = new URLSearchParams({
        category,
        metric,
        minMatches: String(minMatches),
        league,
        season,
        limit: "25",
        offset: String((page - 1) * 25),
      });
      const response = await fetch(
        `/api/${mode === "football" ? "nextfb" : "blockball"}/leaderboards/explore?${filter}`,
        { signal },
      );
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "Leaderboard temporarily unavailable.");
      }
      return response.json() as Promise<BoardResult>;
    },
  });
  const result = query.data;
  const columns = COLUMNS[category].filter((key) => key !== metric);
  const pages = Math.max(1, Math.ceil((result?.total ?? 0) / 25));
  return (
    <div
      className={`next-editorial next-${mode} container mx-auto space-y-7 px-4 py-10`}
    >
      <header className="border-b border-white/15 pb-7">
        <Link href={`/${mode}`} className="next-text-link">
          <ArrowLeft size={14} />{translate(" Back to")}{" "}
          {mode === "football" ? translate("Football") : translate("BlockBall")}
        </Link>
        <p className="next-kicker mt-7">{translate("NEXT / Player rankings")}</p>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight md:text-6xl">
          {mode === "football" ? translate("Football") : translate("BlockBall")}{translate(" leaderboards")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{translate("Choose a competition or collection. Compare the records that matter to you.")}</p>
      </header>
      <nav className="next-section-nav" aria-label={translate("Leaderboard categories")}>
        {Object.entries(CATEGORIES)
          .filter(([key]) => mode === "football" || key !== "classic")
          .map(([key, label]) => (
            <Link
              key={key}
              href={`/${mode}/leaderboards?category=${key}`}
              aria-current={category === key ? "page" : undefined}
            >
              {translate(label)}
            </Link>
          ))}
      </nav>
      <section aria-label={translate("Leaderboard filters")} className="board-filters">
        <label>{translate("Statistic")}<select
            value={metric}
            onChange={(event) =>
              update({ metric: event.target.value, minMatches: null })
            }
          >
            {Object.entries(metrics).map(([key, label]) => (
              <option key={key} value={key}>
                {translate(label)}
              </option>
            ))}
          </select>
        </label>
        {category === "league" && (
          <label>{translate("Competition")}<select
              value={league}
              onChange={(event) =>
                update({ league: event.target.value, season: null })
              }
            >
              <option value="ML">{translate("Major League")}</option>
              <option value="LL">{translate("Lower League")}</option>
            </select>
          </label>
        )}
        {["league", "ut"].includes(category) && (
          <label>{translate("Season")}<select
              value={
                season ||
                (category === "league" && mode === "football" ? "CURRENT" : "")
              }
              onChange={(event) =>
                update({ season: event.target.value || null })
              }
            >
              <option
                value={
                  category === "league" && mode === "football" ? "CURRENT" : ""
                }
              >
                {category === "ut" ? translate("All seasons") : mode === "football" ? translate("Current season") : translate("Latest recorded season")}
              </option>
              {Array.from(
                new Set([
                  ...(result?.seasons ?? []),
                  ...(season && season !== "CURRENT" ? [season] : []),
                ]),
              ).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        )}
        {sample && (
          <label>{translate("Minimum matches")}<select
              value={String(minMatches)}
              onChange={(event) => update({ minMatches: event.target.value })}
            >
              {Array.from(
                new Set([
                  ...(rate ? [1, 10, 20, 50, 100] : [0, 10, 20, 50, 100]),
                  minMatches,
                ]),
              )
                .sort((a, b) => a - b)
                .map((value) => (
                  <option key={value} value={value}>
                    {value === 0 ? translate("No minimum") : translate("{0} matches", [value])}
                  </option>
                ))}
            </select>
          </label>
        )}
      </section>
      <div>
        <h2 className="font-display text-2xl font-bold uppercase">
          {translate(metrics[metric])}
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
          {translate(DETAILS[category])}
        </p>
        {result && (
          <p className="mt-2 text-xs text-muted-foreground">
            {number(result.total)}{translate(" eligible players")}{category === "league"
              ? ` · ${league} · ${result.season === "CURRENT" ? translate("Current season") : result.season || translate("No recorded season")}`
              : ""}
            {sample ? translate(" · Minimum {0} matches", [result.minMatches]) : ""}
          </p>
        )}
      </div>
      <section
        className="board-table-wrap"
        aria-label={translate("{0} leaderboard", [translate(metrics[metric])])}
        aria-busy={query.isFetching}
      >
        {query.isLoading ? (
          <p role="status" className="p-8 text-sm text-muted-foreground">{translate("Loading leaderboard…")}</p>
        ) : query.isError ? (
          <div role="alert" className="p-8">
            <p className="text-sm text-muted-foreground">
              {translate(query.error.message)}
            </p>
            <button
              className="next-text-link mt-4"
              onClick={() => query.refetch()}
            >{translate("Try again")}</button>
          </div>
        ) : !result?.data.length ? (
          <div className="p-8">
            <h3 className="font-semibold">{translate("No eligible players")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{translate("Try another season, statistic or minimum match count.")}</p>
            {result && page > 1 && (
              <button
                className="next-text-link mt-4"
                onClick={() => update({ page: "1" })}
              >{translate("Return to first page")}</button>
            )}
          </div>
        ) : (
          <table className="board-table">
            <caption className="sr-only">
              {translate(CATEGORIES[category])}{translate(" ranked by ")}{translate(metrics[metric])}{translate(", descending")}</caption>
            <thead>
              <tr>
                <th scope="col">{translate("Pos.")}</th>
                <th scope="col">{translate("Player")}</th>
                {columns.map((key) => (
                  <th scope="col" key={key}>
                    {translate(LABELS[key])}
                  </th>
                ))}
                <th scope="col">{translate(metrics[metric])}</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((row) => (
                <tr key={row.uuid}>
                  <td className="board-position">{row.position}</td>
                  <th scope="row">
                    <Link
                      href={`/${mode}/profile/${encodeURIComponent(row.uuid)}`}
                      title={row.uuid}
                    >
                      {row.name || row.uuid.slice(0, 8)}
                    </Link>
                  </th>
                  {columns.map((key) => (
                    <td key={key}>{number(row[key])}</td>
                  ))}
                  <td className="board-primary">
                    {number(row.value, rate || metric === "completion" ? 2 : 0)}
                    {row.value != null &&
                    ["winRate", "completion"].includes(metric)
                      ? "%"
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {result && result.total > 0 && (
        <div className="next-pagination">
          <button
            disabled={page <= 1 || query.isFetching}
            onClick={() => update({ page: String(page - 1) })}
          >{translate("Previous")}</button>
          <span>{translate("Page ")}{page}{translate(" of ")}{pages}
          </span>
          <button
            disabled={page >= pages || query.isFetching}
            onClick={() => update({ page: String(page + 1) })}
          >{translate("Next")}</button>
        </div>
      )}
      {sample && (
        <p className="pb-5 text-xs leading-relaxed text-muted-foreground">{translate("Use the minimum match filter when comparing averages: a longer playing record gives more context than a single match.")}</p>
      )}
    </div>
  );
}
