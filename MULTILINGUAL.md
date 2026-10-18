# Language support — corrected version

The header offers Automatic, English, Italiano, Polski, Español and Deutsch, including on mobile. Automatic selects the first supported browser language (including regional variants such as es-MX and de-AT), falling back to English. A manual choice is saved in localStorage under `next.language`; Automatic clears that preference. Language switching also works when storage is unavailable. The HTML lang attribute follows the selected language.

## Corrections

- Removed language hooks from the plain number-formatting helper in BlockBall Profile and Ranked. Hooks now remain in React components. Initial loading, arriving data, changing sections and updating leaderboard rows no longer change the hook order.
- Plural selection uses the original numeric count independently of the displayed, localized number. Polish counts such as 10 002 now select the correct form.
- Added omitted leaderboard descriptions, season-state text, overview points/wins/coins summaries, statistic labels, archive labels, profile mode labels, search/login errors, form validation messages and table abbreviations.
- Added Spanish and German dictionaries alongside Italian and Polish. Each has 801 keys. Number/date formatting and calendar labels follow the selected language.

## Preserving the original project

The original English text remains the source of truth. `translate("Original English text")` returns that exact English text when English is selected or when a translation is unavailable. No original files were removed. Backend, database code, API clients, application routes, dependency manifests and lockfiles remain byte-identical to the leaderboard baseline. Original CSS is retained with only language-selector rules appended.

Player/team names, cosmetic IDs, card data, identifiers, request parameters, API response values and navigation paths remain original. Unknown externally supplied messages and custom names retain their original text; they are not machine-translated.

Components subscribe through `useLanguage()` and update without remounting the application. Existing query caches, filters, navigation and form values stay in place. Do not call `useLanguage()` inside plain formatting helpers, conditionals, loops or chart callbacks.

## Adding translations

Dictionaries live in `artifacts/next-football/src/i18n/`. English uses the original source strings rather than a duplicate dictionary. Add the same key to each other dictionary. Use `{0}`, `{1}`, etc. for interpolation, with values passed separately:

```tsx
translate("{0} pts · {1} wins", [formattedPoints, formattedWins])
```

Plural entries contain Intl plural categories. If a displayed count is already formatted, provide the raw count as the third argument:

```tsx
translate("{0} matches", [formattedMatches], rawMatches)
```

Adding another language requires a dictionary, registration in the language store and selector, and a date-fns locale registration in `lib/date-locale.ts`.

## Validation

- Frontend TypeScript check and Vite production build passed.
- 25 English render snapshots match the original leaderboard baseline exactly (leaderboard categories, BlockBall profile sections, league sections).
- Actual BlockBall Profile and Ranked components passed loading-to-data transition tests, all five language choices, profile section navigation, filter retention and subsequent data updates in a simulated browser DOM.
- Actual form-message components switch validation messages in all five languages while retaining entered values.
- Browser language detection, saved/manual/automatic preference, localized number formatters, ordinary and grouped-number plurals, dictionary key consistency and interpolation placeholders passed.
- 294 of 338 original files remain byte-identical; 44 contain the localized display wiring. No original file was removed.

A browser visual check against the live production database was not performed. Vite still reports the existing UI sourcemap notices and a bundle-size warning. DOM tests cannot validate chart layout dimensions.

The ZIP excludes Git metadata, installed dependencies and compiler caches. Preserve the existing .git directory when copying this project into your local checkout; use the normal dependency installation workflow.
