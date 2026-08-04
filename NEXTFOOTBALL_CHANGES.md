# NEXT Football frontend update

## Included changes
- Simplified top navigation: NEXTFootball and Blockball are the two main products.
- NEXTFootball menu now exposes Ranked, League, Player Search and Leaderboards directly.
- New landing page focused on the four principal actions.
- League dashboard now combines a standings preview, upcoming fixtures and recent results.
- Full standings, fixtures and results pages remain available through clear links.
- Main League / Lower League switch remains database-compatible with the existing IDs.
- Ranked deep-link support through `/football/leaderboards?tab=ranked`.
- Player ranked tab includes an MMR history chart using the existing API endpoint.

## Database
No database schema or query structure was changed.
