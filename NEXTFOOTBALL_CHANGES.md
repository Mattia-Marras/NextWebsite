# NEXT website UI update

## Main changes

- Rebuilt the first page as a clear game-mode selector between NEXT Football and Blockball.
- Added a centralized `GAME_MODES` configuration so future modes can be added without redesigning the navigation.
- Simplified the desktop and mobile navigation into two levels: game mode, then available sections.
- Kept NEXT Football sections compact and immediately accessible: Ranked, League, Player Search and Leaderboards.
- Preserved the current database and API structure.
- Removed the “today only NEXT Football” copy.
- Fixed Player Search: the leaderboard card is now marked as available and links to the real leaderboard page.
- Improved contrast, spacing, compactness, card hierarchy and mobile behavior.

## Validation

Run before deployment:

```bash
pnpm install --no-frozen-lockfile
pnpm run typecheck
pnpm --filter @workspace/next-football build
```

The build could not be executed in the generation environment because the npm registry was unreachable.
