# Expanded leaderboards

The existing Football and BlockBall Leaderboards pages now share one category-based interface, without adding main navigation items.

## Categories

- Ranked: MMR, wins, matches, goals, assists, saves, passes, win rate and goals/assists/saves per match.
- League: goals, assists, saves, matches and per-match averages; separate ML/LL and seasons.
- Economy: current balances, not lifetime earnings.
- GameBet: net winnings, total staked, won, lost and bets played.
- Ultimate Team: distinct owned card IDs, copies and catalogue completion.
- Progression: level and XP.
- Football Classic: existing non-Ranked gameplay statistics.

## Behaviour

One table is visible at a time. Category, statistic, filters and page are encoded in the URL. Browser history and legacy Football `?tab=` links remain supported. Names link to profiles. Tables have 25 rows per page.

Eligibility, sorting and pagination run on the server over the full relevant dataset, avoiding the previous BlockBall top-100/top-250 truncation. Football Ranked preserves banned-player exclusions. Averages default to a 20-match minimum and always require at least one match. Equal values use match count when available, then UUID.

Football League supports current records and finalized archives. BlockBall defaults to a recorded unfinalized season when present, otherwise its season-list order. Competitions and seasons are never summed together.

GameBet net = total_won - total_lost, matching existing player profiles. Those counters are not relabelled as payout minus stake. UT duplicates increase copies only; completion counts distinct positive-ownership card IDs against the entire selected catalogue. Owners need at least one owned card.

No fabricated weekly totals, collection prices or lifetime earnings were added. Missing optional database tables/columns show an unavailable state rather than artificial zero results. Queries are read-only; no migrations or new package dependencies are required.

## Deployment and verification

Rebuild/deploy BOTH the API server and frontend. New endpoints: GET /api/nextfb/leaderboards/explore and GET /api/blockball/leaderboards/explore. An old backend cannot serve the new views.

Library declarations, API/frontend TypeScript, API build and frontend production build passed. 75 SQL fixture checks covered metric combinations, full-dataset ordering, pagination, sample thresholds, banned players, GameBet negative net, UT duplicate/completion counting, League isolation and invalid input. Fixtures used SQLite-compatible SQL; live MySQL integration was not run. Server-rendered checks passed for all 13 category views, with one table, one active category and profile links per view.

Browser/mobile visual inspection and live databases remain unverified. Existing shared UI source-map warnings and frontend bundle-size advisory remain.
