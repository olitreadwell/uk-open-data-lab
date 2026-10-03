# cycle-hire-docks: The Cycle Hire Docks

## Pitch

Transport for London lists every Santander Cycles docking station in one
keyless call, and each station reports how many docking points it holds. 798
stations hold 20,992 between them, and the shape of that list is lopsided: 551
stations hold between 20 and 39 docking points, 182 hold fewer than 20, and two
hold 60 or more. The biggest is Jubilee Plaza at Canary Wharf with 63.

## Data source

Transport for London Unified API, `/BikePoint`, fetched at deploy time through
the `tfl-bike-points` adapter in `@uk-open-data-connectors/uk-sources`. The endpoint answers
without a key. TfL asks for an app key above the free rate limit, so the
adapter takes one and sends it as `app_key`, and the site does not use it.

Three fields need reading with care, and the page says so:

- `NbDocks` is the number of docking points, which is capacity rather than the
  bikes in them. `NbBikes` and `NbEmptyDocks` move through the day, so the
  chart counts docking points and the page carries the bike totals only as
  build-time stat cards.
- The station's numbers arrive as a key/value property list, not as typed
  fields, so every count is parsed out of a string.
- `RemovalDate` is set on stations TfL has closed but not deleted. The parser
  drops those, which is why the list holds 798 of the 801 records the endpoint
  returns.

## Verdict

**alive**: the call is keyless, it answers in about two seconds, and the
docking-point figures move only when TfL adds or removes stations. The prose
figures (798, 20,992, 63) are re-checked against a fresh call on each loop
iteration.

## What it looks like

Three stat cards (docking stations, docking points, the largest station) above
a dot plot with one dot per station, stacked at the docking points it holds,
plus the dock-size table behind a disclosure and the source list underneath.
