# NEXT Football fixture update

- Team names in fixtures and admin tables are formatted for users (for example `SPARTAK_PLEVEN` becomes `Spartak Pleven`).
- Team logos are loaded from `artifacts/next-football/public/team-logos/`.
- Logo filenames are generated from the official DB team name: uppercase, spaces/symbols replaced by underscores, `.png` extension.
- Missing logos fall back automatically to team initials.
- Editing matches now reloads the correct league teams and supports both Main League and Lower League.
- Match updates can safely change league, home team, and away team while validating them against the official NEXT Football database.
