# gauge-index — The Gauge Index

## Pitch

The Environment Agency runs thousands of river gauges and almost none of them
watch the rain. Counting the stations by river shows the shape of the network,
and the River Thames comes out on top with 55.

## Data source

Environment Agency flood-monitoring API, `/id/stations`, fetched at deploy time
via `@uk-open-data-connectors/uk-sources`. The endpoint caps its response, so `_limit=3000`
returns a few thousand rows rather than the whole network. River names are counted as the
agency publishes them, which is why "Tide" appears second without being a river.

The live level comes from Bourton Dickler on the River Dikler, which publishes
two level measures: a stage and a downstream stage. The story shows the stage,
because that is the gauge flood warnings are read from. The selection lives in
`preferredMeasureIdsFor` in `gauge-data.ts`.

The site is a static export, so both reads happen at build time and the deploy
workflow runs daily to keep them fresh. If the agency API is slow or blocked,
the build falls back to the committed snapshots in `apps/web/src/fixtures/`,
and logs which one it used.

## Verdict

**alive** — the numbers are real, the leader is stable across snapshots, and the
page refreshes on each deploy rather than on each request.

## What it looks like

Three stat cards (gauges in the sample, the busiest river, the live level at
Bourton Dickler) above a horizontal bar chart of the ten busiest rivers, with
the full river table behind a disclosure and a data-source footnote.
