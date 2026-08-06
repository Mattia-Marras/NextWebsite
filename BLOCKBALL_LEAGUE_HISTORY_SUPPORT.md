# BlockBall League history support

The website now reads the league tables created by `LeagueStatsManager` in the BlockBall plugin:

- `blockball_league_teams`, `blockball_league_matches`, `blockball_league_player_stats` for the current competition
- `league_total_player_stats` for career totals
- `league_player_season_stats` for current and past seasons
- `league_player_awards` for official awards

## Added website features

- Season archive selector on `/blockball/main` and `/blockball/lower`
- Full statistics table for each stored season
- Current/past season state
- Season awards with links to player profiles
- Career league totals in BlockBall profiles
- Season-by-season profile history
- Complete award history in profiles

No additional website database migration is required. The tables are created by the BlockBall plugin. The existing `NEXTBB_DB_*` environment variables must point to the same database used by the plugin.
