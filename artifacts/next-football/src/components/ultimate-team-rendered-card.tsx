import { Link } from "wouter";

type CardStat = readonly [label: string, value: number | null | undefined];

interface RenderedCardData {
  playerUuid: string;
  username: string | null;
  seasonId: string;
  cardType: string;
  position: string;
  overall: number;
  owners?: number;
  totalCopies?: number;
  quantity?: number;
}

interface RenderedUltimateTeamCardProps {
  href: string;
  card: RenderedCardData;
  stats: readonly CardStat[];
  competition: string;
  accent: string;
  showOwnership?: boolean;
}

function getCardAppearance(cardType: string, overall: number) {
  const normalized = cardType.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const special =
    normalized.includes("TOTW") ||
    normalized.includes("TEAM_OF_THE_WEEK") ||
    normalized.includes("IN_FORM") ||
    normalized === "IF";

  let filename = "bronzecard.png";

  if (special) {
    filename = "totw_card.png";
  } else if (normalized.includes("GOLD")) {
    filename = "goldcard.png";
  } else if (normalized.includes("SILVER")) {
    filename = "silvercard.png";
  } else if (normalized.includes("BRONZE")) {
    filename = "bronzecard.png";
  } else if (overall >= 85) {
    filename = "goldcard.png";
  } else if (overall >= 75) {
    filename = "silvercard.png";
  }

  return {
    template: `${import.meta.env.BASE_URL}cards/${filename}`,
    primaryText: special ? "#f4d06f" : "#161616",
    secondaryText: special ? "#d8b855" : "#282828",
    dividerColor: special ? "rgba(231,196,87,.62)" : "rgba(20,20,20,.32)",
    special,
  };
}

export function RenderedUltimateTeamCard({
  href,
  card,
  stats,
  competition,
  accent,
  showOwnership = false,
}: RenderedUltimateTeamCardProps) {
  const appearance = getCardAppearance(card.cardType, card.overall);
  const cleanUuid = card.playerUuid.replace(/-/g, "");
  const username = card.username?.trim();
  const displayName = username || (card.playerUuid.length > 13 ? `${card.playerUuid.slice(0, 8)}…` : card.playerUuid) || "PLAYER";
  const displayPosition = card.position.trim().toUpperCase() === "OUTFIELD"
    ? "OF"
    : card.position.trim().toUpperCase() || "OF";
  const skinKey = encodeURIComponent(username || cleanUuid || "Steve");
  const skinSources = [
    `https://render.crafty.gg/3d/bust/${skinKey}`,
    `https://visage.surgeplay.com/bust/512/${encodeURIComponent(cleanUuid || username || "Steve")}`,
    `https://mc-heads.net/body/${skinKey}/left`,
    `https://minotar.net/helm/${skinKey}/256.png`,
  ];

  return (
    <Link
      href={href}
      className="group mx-auto block w-full max-w-[285px] rounded-2xl p-2 transition duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2"
      aria-label={`${displayName}, ${card.overall} overall, ${displayPosition}, ${competition}, season ${card.seasonId}`}
    >
      <div
        className="relative w-full transition-transform duration-300 group-hover:scale-[1.025]"
        style={{
          aspectRatio: "753 / 1054",
          filter: "drop-shadow(0 16px 24px rgba(0,0,0,.42))",
          containerType: "inline-size",
        }}
      >
        <img
          src={appearance.template}
          alt=""
          draggable={false}
          loading="lazy"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        />

        <div
          className="pointer-events-none absolute z-10 flex items-center justify-center overflow-hidden"
          style={{ left: "33%", top: "14.2%", width: "54.2%", height: "40.9%" }}
        >
          <span
            aria-hidden="true"
            className="absolute font-display font-black uppercase opacity-25"
            style={{ color: appearance.primaryText, fontSize: "27cqw" }}
          >
            {displayName.charAt(0)}
          </span>
          <img
            src={skinSources[0]}
            alt=""
            draggable={false}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="relative z-10 h-full w-full select-none object-contain"
            style={{
              objectPosition: "center bottom",
              imageRendering: "pixelated",
              filter: `drop-shadow(0 7px 8px rgba(0,0,0,${appearance.special ? ".72" : ".4"}))`,
            }}
            onError={(event) => {
              const image = event.currentTarget;
              const nextSource = Number(image.dataset.fallbackStep ?? "0") + 1;

              if (nextSource >= skinSources.length) {
                image.style.display = "none";
                return;
              }

              image.dataset.fallbackStep = String(nextSource);
              image.src = skinSources[nextSource];

              if (nextSource === 2) {
                image.style.transform = "scale(1.35) translateY(10%)";
                image.style.transformOrigin = "center top";
              } else {
                image.style.transform = "none";
              }
            }}
          />
        </div>

        <div
          className="absolute z-20 text-center font-display font-black leading-none"
          style={{ left: "13.6%", top: "20%", width: "20%", fontSize: "16cqw", color: appearance.primaryText }}
        >
          {card.overall}
        </div>

        <div
          className="absolute z-20 text-center font-display font-black uppercase leading-none"
          style={{ left: "13.6%", top: "30.2%", width: "20%", fontSize: "5.5cqw", color: appearance.secondaryText }}
        >
          {displayPosition}
        </div>

        <div
          className="absolute z-20 overflow-hidden text-ellipsis whitespace-nowrap text-center font-display font-black uppercase leading-none"
          style={{
            left: "12.5%",
            top: "57.3%",
            width: "75%",
            fontSize: displayName.length > 14 ? "6cqw" : displayName.length > 10 ? "6.6cqw" : "7.7cqw",
            color: appearance.primaryText,
          }}
        >
          {displayName}
        </div>

        <div
          className="absolute z-20"
          style={{ left: "16.5%", top: "62%", width: "67%", height: 1, background: appearance.dividerColor }}
        />

        <div
          className="absolute z-20 grid grid-cols-2"
          style={{ left: "13.5%", top: "65%", width: "73%", rowGap: "3.1cqw", columnGap: "7%" }}
        >
          {stats.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-center font-display uppercase" style={{ gap: "7%" }}>
              <span
                className="text-right font-black leading-none"
                style={{ color: appearance.primaryText, fontSize: "7.4cqw", minWidth: "1.6em" }}
              >
                {value ?? "—"}
              </span>
              <span
                className="font-black leading-none"
                style={{ color: appearance.secondaryText, fontSize: "4cqw", minWidth: "2.4em" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div
          className="absolute z-20 flex flex-col items-center text-center font-display uppercase leading-none"
          style={{ left: "12%", top: "87.6%", width: "76%", color: appearance.secondaryText }}
        >
          <span className="max-w-full truncate font-bold" style={{ fontSize: "3cqw", letterSpacing: ".13em", opacity: .7 }}>
            {competition}
          </span>
          <span className="mt-1 font-black" style={{ fontSize: "5cqw", color: appearance.primaryText, letterSpacing: ".08em" }}>
            SEASON {card.seasonId}
          </span>
        </div>
      </div>

      {showOwnership ? (
        <div className="mx-3 mt-2 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-xs text-muted-foreground">
          {card.quantity !== undefined ? (
            <span>Owned <b className="text-foreground">×{card.quantity}</b></span>
          ) : (
            <>
              <span>Owners <b className="text-foreground">{card.owners ?? 0}</b></span>
              <span>Copies <b className="text-foreground">{card.totalCopies ?? 0}</b></span>
            </>
          )}
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
        </div>
      ) : null}
    </Link>
  );
}
