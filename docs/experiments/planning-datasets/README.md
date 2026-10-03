# planning-datasets: The Planning Datasets

## Pitch

The Planning Data platform collects planning and housing data from councils
and government bodies across England into one catalogue, and the catalogue
call reports how many records sit behind each dataset. The list is 201
datasets holding 25,355,887 records, but the records are not spread evenly:
title boundary, the index polygons HM Land Registry draws around registered
titles, holds 22,740,586 of them, which is nearly nine in ten. The ten
largest datasets hold 98.8 per cent between them, and 84 of the datasets
listed hold no records at all.

## Data source

Planning Data, `https://www.planning.data.gov.uk/dataset.json`, fetched at
deploy time through the `planning-datasets` adapter in `@uk-open-data-connectors/uk-sources`.
The endpoint answers without a key, and the platform is built by the Ministry
of Housing, Communities and Local Government, with the data under the Open
Government Licence v3.0.

Two things need reading with care, and the page says so:

- The same file lists the platform's pipeline configuration, data
  specifications, and provenance tables next to the datasets. The adapter
  keeps the entries whose `realm` is `dataset`, which is 201 of the 222 rows,
  and the record counts come from those.
- `entity-count` is the platform's own count of published records. It is 0
  for a dataset that is still being built, which is why 84 datasets carry no
  records yet. Most of those are in alpha.

## Verdict

**alive**: the call is keyless, it answers in about a second, and it returns
the whole catalogue in one response. The record counts move as councils
publish, so the prose keeps to what holds (one dataset carries nearly nine in
ten records, most datasets are small) and the exact build-day totals live in
the stat cards and the source note, filled from the same read the chart draws.

## What it looks like

Three stat cards (datasets listed, records behind them, the largest dataset)
above a Pareto chart of the ten largest datasets, with the running share of
all records as a line, plus the dataset table behind a disclosure and the
source list underneath.
