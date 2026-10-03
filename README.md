# uk-open-data-lab

Example site for
[uk-open-data-connectors](https://github.com/olitreadwell/uk-open-data-connectors).
Five microsites showing the full pipeline from a UK public-data connector to a
deployed static chart.

## The microsites

- **The gauge index**: the Environment Agency's flood-monitoring list runs to
  thousands of stations across England. The River Thames carries 55 of them,
  more than any other river, and nearly every station publishes water level
  rather than rainfall. Data from the agency flood-monitoring API, fetched at
  deploy time under the Open Government Licence v3.0.
- **The ONS catalogue**: the ONS beta API lists 338 dataset records, 310 of them
  stamped 2023 or 2024 and 281 flagged as national statistics. Data from the
  ONS beta API, fetched at deploy time under the Open Government Licence v3.0.
- **The food hygiene registers**: the Food Standards Agency lists 363 local
  authority food hygiene registers holding more than 612,000 establishments,
  with Birmingham's 10,239 at the top. Data from the FSA Food Hygiene Rating Scheme
  API, fetched at deploy time under the Open Government Licence v3.0.
- **The cycle hire docks**: Transport for London lists 798 Santander Cycles
  docking stations holding 20,992 docking points, most of them between 20 and
  39. Data from the TfL Unified API, fetched at deploy time under TfL Open
  Data.
- **The planning datasets**: the Planning Data platform lists 201 datasets for
  England holding 25,355,887 records, and one of them, title boundary, holds
  nearly nine in ten of them. Data from the platform's dataset catalogue,
  fetched at deploy time under the Open Government Licence v3.0.

## What this example shows

- `apps/web/src/lib/gauge-data.ts` calls `parseFloodStations` from
  `@uk-open-data-connectors/uk-sources` to pull the station list at build time, and
  `parseFloodReadings` for the live level at Bourton Dickler.
- The build falls back to committed snapshots when the agency API is slow or
  blocked, so the static export always succeeds.
- `GaugeRiversChart` renders the ranking with Recharts; the page and chart have
  unit tests, and the e2e suite asserts a plausible live level and station count.

## Connectors wiring

The site uses one package from the connectors repo, `@uk-open-data-connectors/uk-sources`,
vendored under `packages/uk-sources`. npm git dependencies cannot target a
subpackage inside a workspace monorepo, so the package is copied here and kept
in sync with a script:

```bash
node scripts/sync-connectors.mjs                     # uses ../uk-open-data-connectors
node scripts/sync-connectors.mjs --from /path/to/repo
```

The script renames whatever scope the connectors package ships under to
`@uk-open-data-lab`, strips the `.js` extension from relative imports, and points the
package entry at `src/`. All three happen in the script rather than by hand, so
a sync is reproducible.

Edit `packages/uk-sources` only by syncing from the connectors repo.

## Stack

- Next.js 16, React 19.2, TypeScript
- Tailwind CSS 4 + SCSS hybrid, shadcn/ui (Base UI primitives)
- Vitest + Testing Library + jest-axe (unit/a11y), Playwright + `@axe-core/playwright`
- Monorepo: Turborepo, npm workspaces

## Quick start

```bash
npm install
npm run dev
```

## Checks

```bash
npm run type-check
npm test
npm run lint
npm run build
```

Playwright serves the built `out/` directory on port 3000. Set `E2E_PORT` to run
the suite beside another dev server.
