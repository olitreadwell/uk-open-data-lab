# parliament-seats: The House of Commons, seat by seat

## Pitch

The House of Commons holds 650 seats, and every one of them belongs to a
party. The UK Parliament Members API reports the state of the parties in the
Commons, with the seats each party holds and the members counted behind them.
Labour holds the largest block at 403 seats, the Conservatives hold 118, and
18 parties hold at least one seat. Six of those parties hold exactly one, and
one of the seats has nobody in it at all.

## Data source

The UK Parliament Members API,
`https://members-api.parliament.uk/api/Parties/StateOfTheParties/1/<date>`,
read at deploy time through the `parliament-seats` adapter in
`@uk-open-data-connectors/uk-sources`. The call needs a house number and a date, so the adapter
asks for house 1 (the Commons) on the build day. It answers without a key, and
Parliament publishes the data under the Open Parliament Licence v3.0.

Two things need reading with care, and the page says so:

- A vacant seat is listed as its own party, named `Vacant`, with one seat and
  no member behind it. The parties therefore add up to the whole chamber while
  the members named sit one short.
- Each party carries the colour the API publishes for it, and two parties,
  including the Speaker, carry none. Those squares are drawn in the page's own
  grey rather than a party colour.

## Verdict

**alive**: the call is keyless and returns the whole chamber in one response
of a few kilobytes. It can be slow, so the adapter gives it a 60 second
timeout and the page keeps a committed snapshot as a fallback. Seats move
rarely, so the copy states the structure of the chamber and the build-day
totals live in the stat cards and the source note, filled from the same read
the chart draws.

## What it looks like

Three stat cards (seats in the Commons, the largest party, the parties holding
a seat) above a 650-square waffle, one square per seat and coloured by party,
with a colour legend and the seat table behind a disclosure. The source list
sits underneath.

The build is written up in [TUTORIAL.md](TUTORIAL.md).
