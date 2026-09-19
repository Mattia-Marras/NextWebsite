# NextFootball Ranked Season History

The NextFootball website now exposes the permanent Ranked season archive created by the Minecraft plugin.

## Backend API

- `GET /api/nextfb/ranked/seasons`
  - Returns the current season number/start date and all archived seasons.
- `GET /api/nextfb/leaderboards/ranked/seasons/:seasonId`
  - Returns the archived final player snapshot for a completed season, enriched with Minecraft usernames.

The API reads the plugin tables `ranked_season_state`, `ranked_seasons`, and `ranked_season_players` directly. No duplicate website-side season storage is introduced.

## Frontend

The NextFootball Ranked page now includes a **Ranked seasons** selector. Users can switch between the live season and any archived season. Archived views reuse the Ranked dashboard and show final MMR/rank data, player statistics, rank distribution, leaders, aggregate totals, season dates, and archived player/eligibility counts.

Player profiles also include a **Ranked season history** table with each archived season's final rank, final/peak MMR, official placement, matches, W-L-D record, goals, assists, and saves.

If the archive metadata endpoint is unavailable (for example before the updated plugin has created its history tables), the existing live Ranked page continues to work and displays a non-blocking archive-unavailable message.
