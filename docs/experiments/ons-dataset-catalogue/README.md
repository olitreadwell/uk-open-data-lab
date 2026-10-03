# ons-dataset-catalogue — The ONS Catalogue

## Pitch

The ONS beta API is the programmatic front door to the ONS dataset
collection, and its catalogue list is one of the few places you can see the
whole thing at once. It reports 338 dataset records. Counting them by the
year in their last-updated stamp shows where the catalogue sits: 180 records
in 2023, 130 in 2024, and 12 across 2025 and 2026.

## Data source

ONS beta API, `/v1/datasets?limit=1000`, fetched at deploy time through the
`ons-datasets` adapter in `@uk-open-data-connectors/uk-sources`. The call is keyless. The
endpoint answers with its whole catalogue below the requested limit: the
response reports `total_count` 338 against a limit of 1000, so the list is
complete rather than a first page.

Two fields need reading with care, and the page says so:

- `last_updated` is the API's stamp on the dataset record, not the release
  date of the data behind it. It moves when the record changes.
- `national_statistic` is present on 321 of the 338 records. 281 are true, 40
  are false, and 17 leave the field out, which is why the copy gives all three
  numbers.

The same endpoint is the one the ONS Developer Hub documents. The retired
`api.ons.gov.uk` service is not used here: it was replaced for dataset
metadata by the beta API.

## Verdict

**alive** — the counts come from a live call at every deploy, the endpoint is
keyless, and the numbers are stable across snapshots within a day. The prose
numbers (338, 310, 281) are checked against a fresh call on each loop
iteration, because the ONS adds datasets from time to time.

## What it looks like

Three stat cards (datasets listed, records stamped 2023 or 2024, records
flagged as national statistics) above a histogram of last-updated years, with
the year table behind a disclosure and the source list underneath.
