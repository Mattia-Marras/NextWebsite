# BlockBall website database

The BlockBall API uses these environment variables:

- `NEXTBB_DB_HOST`
- `NEXTBB_DB_PORT` (defaults to `3308`)
- `NEXTBB_DB_NAME` (defaults to `BlockBall`)
- `NEXTBB_DB_USER`
- `NEXTBB_DB_PASSWORD`

For compatibility, host/user/password fall back to the corresponding `NEXTFB_DB_*` values when the dedicated BlockBall values are not set.

Player names are resolved exclusively through `player_names`. Mojang/PlayerDB are intentionally not used because BlockBall runs in offline mode and stores offline UUIDs.

Tables read by the website:

- `players`
- `player_names`
- `casino_player_stats`
- `player_available_cosmetics`
- `player_active_cosmetics`
- `blockball_league_teams`
- `blockball_league_matches`
- `blockball_league_player_stats`

## Secure administration
Set `ADMIN_PASSWORD` in Railway Variables. It is validated only by the API server and is never included in the frontend bundle. Admin sessions use an HttpOnly, Secure, SameSite=Strict cookie and expire after eight hours.
