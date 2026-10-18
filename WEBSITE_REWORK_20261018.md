# NEXT Website Rework — 18 Oct 2026

## Implemented priorities

1. **Network landing page**
   - stronger hero and positioning of NEXT as one competitive network;
   - clearer join/community actions;
   - redesigned Football and BlockBall entry cards;
   - new section explaining Ranked, League, economy/collection and player profiles.

2. **Game-mode overview pages**
   - new `/football` overview;
   - new `/blockball` overview;
   - each surfaces Ranked, League and Economy before sending users to deep-dive pages;
   - live previews use the existing APIs rather than hard-coded statistics.

3. **Player overview**
   - NextFootball overview reorganized around competitive status, league career, economy and account progression;
   - added useful rates such as goals/assists/saves per match;
   - BlockBall profile receives the same top-level competitive snapshot.

4. **Graphics and motion**
   - shared page reveal, ambient background movement, animated accent lines and hover lift;
   - `prefers-reduced-motion` support included.

5. **Data / navigation improvements**
   - explicit Overview navigation item for each game mode;
   - fixed Ranked active-state handling for both Football and BlockBall;
   - added public BlockBall economy overview endpoint with total/average balances and richest players so the website does not infer economy metrics from an unrelated player list.

## Main files changed

- `artifacts/next-football/src/pages/landing.tsx`
- `artifacts/next-football/src/pages/mode-overview.tsx` (new)
- `artifacts/next-football/src/pages/profile.tsx`
- `artifacts/next-football/src/pages/blockball-profile.tsx`
- `artifacts/next-football/src/components/layout.tsx`
- `artifacts/next-football/src/lib/game-modes.ts`
- `artifacts/next-football/src/lib/blockball-api.ts`
- `artifacts/next-football/src/index.css`
- `artifacts/next-football/src/App.tsx`
- `artifacts/api-server/src/routes/blockball.ts`

## Player-facing refinement (revision 2)

- Replaced development commentary with player-facing copy and a three-step getting-started section.
- Added Major/Lower League selectors directly in each mode overview.
- Made Ranked, League and Economy requests independent, with section-specific loading and error states.
- Football economy preview now shows coin balances rather than treating house betting statistics as the whole economy.
- Expanded BlockBall profiles with section navigation, league averages, career awards, peak MMR and collection status.
- Added profile loading skeletons, retry action, clipboard feedback and clearer unavailable states.
- Added shared viewport entry animations, pitch artwork and touch/reduced-motion adjustments.
- Preserved existing API routes and detailed profile sections.

## Validation

- All 100 frontend TypeScript/TSX files syntax-transpiled successfully.
- API client declarations built successfully; frontend TypeScript check passed.
- Vite production frontend build passed (2,799 modules).
- Vite reports an existing large-bundle advisory and source-map warnings from shared UI components.
- Live database integration requires the configured running API and was not exercised here.
- Browser visual verification could not run: the test browser download failed in this environment.


## Matchday design revision

- Rebuilt the network homepage around NEXT branding, pitch artwork and direct game entry points.
- Removed repeated feature cards, decorative numbering and generic marketing sections.
- Added current Ranked previews from existing Football and BlockBall APIs with independent unavailable states.
- Introduced an editorial sports treatment: flatter surfaces, compact labels, larger type and distinct game layouts.
- Football mode leads with Ranked; BlockBall mode leads with League. Existing league selectors and detailed routes remain available.
- Updated both player pages with the same sports identity, preserving their existing data sections.
- Added a local SVG pitch component and a short pass-path animation, respecting reduced motion.
- Kept the original logo. The other site's reference screenshot is not used as NEXT content.

Validation: frontend TypeScript check passed and production build passed (2,800 modules). Existing shared UI sourcemap warnings and large-bundle advisory remain. Browser visual verification was attempted but could not complete in this environment. Live database integration was not exercised.


## Navigation and content organization revision

BlockBall profiles now show one page section at a time, retaining the shared player header:
- `/blockball/profile/:uuid`: compact overview and links.
- `/blockball/profile/:uuid/ranked`: record and MMR chart.
- `/blockball/profile/:uuid/league`: league career, seasons and awards.
- `/blockball/profile/:uuid/ultimate-team`: on-demand collection, search, season filter and 12 cards per page.
- `/blockball/profile/:uuid/cosmetics`: owned and active cosmetics.
- `/blockball/profile/:uuid/gamebet`: GameBet activity.

BlockBall League has separate overview, standings, results, players, archive and awards pages under `/blockball/main` and `/blockball/lower`. Overview contains standings and three latest results. The results page supports club search and 12 matches per page. Archive and awards share a season selector; past season selection does not affect current standings.

Additional refinements:
- Player names link to profiles in homepage Ranked previews and mode Ranked/economy previews.
- Mode overviews have a shorter header and compact navigation instead of repeated promotional panels.
- Profile overview reduces repeated rank information.
- Navigation exposes the active page and supports direct URLs and browser history.
- Wider tables remain within horizontal scrolling containers; match names can wrap on small screens.

Validation: frontend TypeScript passed; production Vite build passed. Server-rendered fixture checks passed for all 12 profile/league sections, including overview isolation, three-result preview and 12-result pagination. Live database integration and browser/mobile visual checks remain unverified. Existing shared UI source-map warnings and bundle-size advisory remain.


## Merge recovery
Resolved conflict markers in five files and restored the complete latest rework. No other source changes. Frontend TypeScript and production build were rechecked successfully. The delivery archive excludes Git metadata to preserve the existing local repository.
