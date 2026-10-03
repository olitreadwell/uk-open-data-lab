# Index

A map of this repo for anyone (or any agent) arriving cold.

## The site

`uk-open-data-lab` is a static Next.js export of small experiments on UK public
data. Five microsites are published. The home page is
(`apps/web/src/app/page.tsx`), and each story lives at
`/<category-slug>/<slug>/`.

- [gauge-index](docs/experiments/gauge-index) (alive) The River Thames carries
  55 gauges, more than any other river in the sample, from the Environment
  Agency flood-monitoring API.
- [ons-dataset-catalogue](docs/experiments/ons-dataset-catalogue) (alive) The
  ONS beta API lists 338 datasets, and 310 of them carry a 2023 or 2024
  last-updated stamp.
- [food-hygiene-registers](docs/experiments/food-hygiene-registers) (alive)
  Birmingham lists 10,239 food outlets, the largest of the FSA's 363 local
  authority registers.
- [cycle-hire-docks](docs/experiments/cycle-hire-docks) (alive) Transport for
  London lists 798 Santander Cycles docking stations holding 20,992 docking
  points.
- [planning-datasets](docs/experiments/planning-datasets) (alive) The Planning
  Data platform lists 201 datasets holding 25,355,887 records, and one of
  them holds nearly nine in ten of those records.

## Where things are

- `apps/web/src/lib/microsites.ts` - the story corpus. Copy, categories, and
  source citations for every microsite, published or not.
- `apps/web/src/lib/gauge-data.ts` - the fetch and transform layer for the
  gauge story. Live read at build time, committed snapshot as fallback.
- `apps/web/src/lib/ons-catalogue-data.ts` - the same shape for the ONS
  catalogue story.
- `apps/web/src/lib/food-hygiene-data.ts` - the same shape for the food hygiene
  registers story.
- `apps/web/src/lib/cycle-hire-data.ts` - the same shape for the cycle hire
  docks story.
- `apps/web/src/lib/planning-data.ts` - the same shape for the planning
  datasets story.
- `apps/web/src/components/` - chart and page components, each with unit tests.
- `packages/uk-sources/` - the vendored connectors package. Never edit by hand;
  run `node scripts/sync-connectors.mjs`.
- `docs/experiments/<slug>/` - one folder per experiment: the pitch, the data
  source, and a verdict on whether it worked.
- `skills/` - the loop skills this repo runs.

## Checks

`npm run check` runs format, lint, type-check, tests with coverage, build,
smoke, e2e, and the internal link check.
