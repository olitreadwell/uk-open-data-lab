# parliament-seats: draw the whole House of Commons as a waffle

`parliament-seats` is the tenth published microsite on `uk-open-data-lab`. It draws
all 650 seats of the House of Commons as one square per seat, coloured by the
party that holds it, from the UK Parliament Members API.

Connector: @uk-open-data-connectors/uk-sources#parliament-seats

## What you build

A static page at `/society/parliament-seats/` with three parts:

- a waffle of 650 squares, one per seat, grouped by party from the largest
  block down, so the shape of the chamber reads at a glance;
- three stat cards for the seats in the house, the largest party, and the
  number of parties holding a seat;
- a data table behind a disclosure with every party, its seats, its share of
  the house, and the women and men counted behind it.

The page is prerendered at build time, so the numbers in the cards, the squares
on the page, and the sentence in the source note all come from one read of the
API.

## Where the data comes from

The UK Parliament Members API,
`https://members-api.parliament.uk/api/Parties/StateOfTheParties/{house}/{date}`.
House 1 is the Commons and house 2 is the Lords, and the date is part of the
path. The response lists one row per party with `male`, `female`, `nonBinary`,
`total`, and the party's own id, name, abbreviation, and colours.

The data is public and keyless. Parliament publishes it under the Open
Parliament Licence v3.0,
`https://www.parliament.uk/site-information/copyright-parliament/open-parliament-licence/`.

## The steps

1. Capture the source. Save the Commons payload for the build day from
   `https://members-api.parliament.uk/api/Parties/StateOfTheParties/1/<date>`
   as the committed fixture, in the connectors package and again in this app.
2. Register the source. Add the Members API to
   `~/code/open-data/awesome-open-uk-data` with a real description and a URL
   that answers, rebuild the snapshot, update the seeded source table, and
   push `main` there.
3. Write the adapter. `packages/uk-sources/src/parliamentSeats.ts` holds the
   zod schema, the strict parse, the summary, the fetch, and the adapter
   object; `parliamentSeats.test.ts` covers each rejection and the fixture.
4. Register and export it. Add the adapter to `registry.ts`, export the public
   surface from `index.ts`, add a row to the package README, and update the
   source lists the CLI and API tests assert.
5. Run the connectors gate. `npm run check` (format, build, lint, type-check,
   tests with coverage) and `npm run test:smoke` against the live APIs.
6. Ship the adapter. Push `feat/connectors/add_parliament_seats_adapter`, open
   the PR with `gh pr create --fill`, then vendor it here with
   `node scripts/sync-connectors.mjs --from ../uk-open-data-connectors`.
7. Add the web data layer. `apps/web/src/lib/parliament-seats-data.ts` reads
   the adapter live with a one second revalidate window and falls back to the
   committed snapshot, logging when it does.
8. Build the chart. `ParliamentSeatsChart.tsx` flattens the seats into one
   square each, draws them in a 26 column grid, and carries the numbers in a
   `ChartDataTable`. Add a unit test for the cells, the rows, the accessible
   name, axe, and the empty case.
9. Write the story. Add the config to `microsites.ts`, wire the case in
   `[slug]/page.tsx`, add the page-test block, and put the slug in
   `published-microsites.ts`.
10. Verify. Run `npm run check` with `E2E_PORT=3100` if port 3000 is busy,
    push `main`, and check the production page against a fresh call to the
    endpoint.

## What actually broke

- The first call to the endpoint timed out at 25 seconds and the next answered
  in two. The adapter uses a 60 second timeout and the web layer keeps a
  committed snapshot, so a slow API delays a build rather than failing one.
- The first waffle drew black squares for the Speaker and Restore Britain.
  `backgroundColour` is null for those parties, so the chart needed its own
  fallback colour instead of reading the field straight.
- A check that `male + female + nonBinary` equals `total` rejected the
  payload. A vacant seat is listed as its own party with one seat and no
  members, so the parse records the gap as `unallocatedSeatCount` instead of
  demanding the two agree.
- The vendored copy of the package drops `.js` from relative imports while the
  connectors source keeps them. An extensionless export in `index.ts` built
  locally but broke the CLI test, which runs the compiled `dist`; the export
  needs `./parliamentSeats.js` on the connectors side.
- The API package's live smoke test still asserted a three-source list from
  when the repo carried three adapters, so it failed on the eleventh. The list
  now names all of them.

## One variation to try

The same endpoint takes house 2 for the Lords, and it returns peers grouped the
same way. Point the adapter at house 2 and the same waffle draws the upper
house, where no party holds a majority and the Crossbench group is the second
largest. A second variation is to move the date: the path already carries one,
so a selector could redraw the chamber as it stood after a past general
election.
