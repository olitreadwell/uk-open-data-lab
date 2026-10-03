# food-hygiene-registers: The Food Hygiene Registers

## Pitch

Every food business in the UK sits on a register kept by its local council, and
the Food Standards Agency publishes the whole set in one call. Birmingham's
register is the largest at 10,239 establishments, and the 363 registers between
them hold 612,772. Scotland runs a separate scheme, which is why 32 of those
registers look different from the other 331.

## Data source

Food Standards Agency Food Hygiene Rating Scheme API, `/Authorities/basic`,
fetched at deploy time through the `food-hygiene-authorities` adapter in
`@uk-open-data-connectors/uk-sources`. The call carries the `x-api-version: 2` header the FSA
asks for. Without it the endpoint answers HTTP 404, which reads like a retired
service but is a missing header.

Two fields need reading with care, and the page says so:

- `EstablishmentCount` is the number of premises on the register, not the
  number that have been inspected or rated.
- `SchemeType` splits the list: 331 registers run the Food Hygiene Rating
  Scheme, where premises score out of five, and 32 Scottish registers run the
  Food Hygiene Information Scheme, where premises pass or need to improve. The
  Scottish premises records confirm the mapping: they return `SchemeType`
  "FHIS" and `RatingValue` "Pass".

## Verdict

**alive**: the counts come from a live call at every deploy, the endpoint is
keyless, and repeated calls in the same day return the same totals. The prose
numbers (363, 612,772, 10,239) are re-checked against a fresh call on each loop
iteration. The register count and Birmingham's figure have held steady; the
establishment total drifts upward as premises are added (612,721 on 24
September, 612,772 on 25 September).

## What it looks like

Three stat cards (establishments listed, registers listed, the largest
register) above a horizontal bar chart of the ten largest registers, with the
full register table behind a disclosure and the source list underneath.
