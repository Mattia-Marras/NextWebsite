# Match scheduling form improvements

- NEXT Football is fixed as the active game, so the redundant server selector was removed.
- Date and kickoff time are separate fields.
- Kickoff time may be marked as not announced; public pages then show `Time TBA`.
- Scores are hidden for scheduled matches and appear only for live or finished matches.
- Venue is moved into an optional details section.
- The form is responsive and uses clearer user-facing labels.

## Time TBA storage

To remain compatible with the existing `website_matches` table and API, a match without an announced kickoff time is stored internally at 12:00 local time. Frontend formatting recognizes this placeholder and displays `Time TBA` rather than 12:00.
