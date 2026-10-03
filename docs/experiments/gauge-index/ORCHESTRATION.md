# ORCHESTRATION.md — gauge-index

Built 2026-09-23 to prove out `@uk-open-data-connectors/uk-sources` end to end.

- TDD: the transform tests were written first (`buildGaugeStationIndex`,
  `preferredMeasureIdsFor`, `buildGaugeLiveLevel`), then the chart and page.
- Live smoke test run explicitly: `RUN_SMOKE=1 npm run test:smoke -w @uk-open-data-connectors/uk-sources`.
- One real finding surfaced by running the parser against the full station list:
  the agency returns some text fields as arrays and leaves nine groundwater
  stations without coordinates, which made the whole payload unparseable. Fixed
  in the connector, with regression tests for both shapes.

## Timing note

The station endpoint takes about nine seconds to answer for a few thousand rows, well
past the five second default probe timeout in the connector. `gauge-data.ts`
raises its own build-time timeout to 60 seconds and keeps the committed snapshot
for when even that is not enough.
