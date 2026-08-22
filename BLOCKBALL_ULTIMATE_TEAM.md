# BlockBall Ultimate Team website integration

The website now reads the BlockBall UT catalogue and collections from the same
database configured through the existing `NEXTBB_DB_*` environment variables
(with the website's current `NEXTFB_DB_*` fallback).

## Database tables

- `ultimate_cards`: S1/S2 card definitions and their six BlockBall statistics.
- `ultimate_card_collection`: owner UUID, card ID, duplicate quantity and first obtained date.
- `player_names`: local username resolution, including cracked/offline UUID players.

The plugin creates these tables automatically. No additional website migration is required.

## Routes

- Website catalogue: `/blockball/ultimate-team`
- Global API: `/api/blockball/ultimate-team/cards`
- Player collection API: `/api/blockball/ultimate-team/players/:uuid`

Each BlockBall profile also displays its owned UT cards and duplicate quantities.
