# NEXT Football official database integration

The website no longer reads teams, fixtures, results or standings from the local PostgreSQL `teams` and `matches` tables.

## Data sources

- Teams: existing `league_teams` table in the official NEXT Football MySQL database.
- Leagues: existing `leagues` table.
- Fixtures/results: new `website_matches` table in the same official NEXT Football MySQL database.
- Standings shown by the website: calculated from finished rows in `website_matches` and official teams in `league_teams`.

The API creates `website_matches` automatically. If the database account does not have `CREATE TABLE`, run `database/nextfb_website_matches.sql` once.

## League mapping

Set these Railway variables to avoid relying on league-name/order detection:

```env
NEXTFB_MAIN_LEAGUE_ID=1
NEXTFB_LOWER_LEAGUE_ID=2
```

Use the actual IDs from:

```sql
SELECT id, name FROM leagues ORDER BY id;
```

## Admin behaviour

- `Matches`: can manually create fixtures and enter/edit results.
- `Teams`: read-only and always sourced from the plugin database.
- Blockball is not written into the NEXT Football database and currently returns no teams/matches through this adapter.
