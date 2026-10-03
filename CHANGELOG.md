## 2026-08-19 08:05 (NZST) - loop 14

- Handed off (unmerged, awaiting review): unemployment-ranks (viz-095,
  branch feat/microsite-loop-14, review issue #264), median-age-by-region
  (viz-069, branch feat/microsite-loop-14, review issue #265), and
  tourist-arrivals (viz-016, branch feat/microsite-loop-14, review issue
  #266). A parallel coordinates chart of regional unemployment ranks across
  the nine quarters from December 2023 to December 2025 with a movers
  toggle, a tile grid of regional median ages at the 2013, 2018, and 2023
  censuses with a census-year toggle, and a Cleveland dot plot of visitor
  arrivals by country of residence for the years ended December 2015 and
  2019 with a year toggle and country filter. Chart types parallel
  coordinates, tile grid, and dot plot are new to the site.
- Sources: Stats NZ Household Labour Force Survey December 2025 quarter
  (Table 6, regional unemployment rates), "2023 Census population counts
  (by ethnic group, age, and Maori descent) and dwelling counts" (Table 7,
  age in five-year groups by regional council area), and "International
  travel: December 2019" (Table 4, visitor arrivals by country of
  residence). Every rate, median age, and arrival count was verified
  against the release workbooks before committing. All reference URLs
  return 200. Chart types used so far: line, area, bar, scatter, donut,
  treemap, map, histogram, radial, bubble, slope, timeline, funnel,
  waterfall, sunburst, lollipop, heatmap, pareto, cycle plot, streamgraph,
  dumbbell, ridgeline, unit chart, waffle, bump, bar-in-bar, marimekko,
  choropleth, strip chart, parallel coordinates, tile grid, dot plot.
- Loop review: this iteration resumed the stalled loop-14 work (a previous
  run hit the time cap at 07:26 after committing two microsites but before
  pushing or filing review issues). The two committed microsites were
  verified (tsc, vitest, lint) and a third was built from the next open
  issue whose source is proven in this repo: all priority-high issues are
  already built, and the top priority-medium candidates map to chart types
  already on the site or to census topic releases that no longer ship
  workbooks, so the loop took viz-016 (tourist arrivals by country) as a
  dot plot from the verified International travel December 2019 workbook.
  Research took longest: checking which open issues were unbuilt and which
  Stats NZ releases still ship workbooks. The rebase onto origin/main went
  cleanly (no file overlap with the quality loop's merges).

## 2026-08-19 05:23 (NZST) - loop 13

- Handed off (unmerged, awaiting review): population-waffle (viz-053,
  branch feat/microsite-loop-13, review issue #248), export-market-bump
  (viz-021, branch feat/microsite-loop-13, review issue #249), and
  enterprise-bar-in-bar (viz-055, branch feat/microsite-loop-13, review
  issue #250). A waffle chart of the census usually resident population by
  regional council area with a census-year toggle and region search, a bump
  chart of export destination ranks for the years ended March 2015 to 2020
  with a top-8/top-5 toggle, and a bar-in-bar chart of enterprises by
  industry at February 2020 and February 2025 with a sort toggle and
  industry search. Chart types waffle, bump, and bar-in-bar are new to the
  site.
- Sources: Stats NZ "2023 Census population counts (by ethnic group, age,
  and Maori descent) and dwelling counts" (Table 1), "Goods and services
  trade by country: Year ended March 2020" (map data table, total exports by
  country for the years ended March 2015 to 2020), and "New Zealand business
  demography statistics: At February 2020" and "...At February 2025" (Table
  1, enterprises by industry). Every count and rank was verified against the
  release workbooks before committing. All reference URLs return 200. Chart
  types used so far: line, area, bar, scatter, donut, treemap, map,
  histogram, radial, bubble, slope, timeline, funnel, waterfall, sunburst,
  lollipop, heatmap, pareto, cycle plot, streamgraph, dumbbell, ridgeline,
  unit chart, waffle, bump, bar-in-bar.
- Loop review: research took longest: all priority-high data-viz-idea
  issues were already built, so the loop took the highest-ranked unbuilt
  priority-medium ideas whose sources are proven in this repo (viz-053,
  viz-021, viz-055) and verified the numbers from the release workbooks
  (the census Table 1 totals, the trade map CSV ranks computed from the full
  country list, and the two business demography releases). The viz-055 spec
  story (construction and professional services as the biggest blocks)
  contradicted the data, which shows rental, hiring, and real estate
  services leading with 129,120 enterprises, so the copy tells the honest
  version. The build added home-page cards for the three microsites in the
  same commits, which loops 11 and 12 omitted, so the handed-off microsites
  are reachable from the home grid instead of only by direct URL.

## 2026-08-19 04:30 (NZST) - loop 12

- Handed off (unmerged, awaiting review): regional-population-growth (viz-022,
  branch feat/microsite-loop-12, review issue #240), age-bulge (viz-013, branch
  feat/microsite-loop-12, review issue #241), and ethnic-mix (viz-043, branch
  feat/microsite-loop-12, review issue #242). A dumbbell chart of census
  population by regional council in 2013 and 2023 on a log scale with a sort
  toggle, a ridgeline chart of the five-year age distribution across the 2013,
  2018, and 2023 censuses with a year toggle and hover readout, and a unit
  chart of ethnic group shares at three censuses with a year toggle. Chart
  types dumbbell, ridgeline, and unit chart are new to the site.
- Sources: Stats NZ "2023 Census population counts (by ethnic group, age, and
  Maori descent) and dwelling counts" release workbook (Tables 1, 4, and 6,
  published 29 May 2024). Every population count, ethnic share, and median
  age was verified against the release workbook before committing. All
  reference URLs return 200. Chart types used so far: line, area, bar,
  scatter, donut, treemap, map, histogram, radial, bubble, slope, timeline,
  funnel, waterfall, sunburst, lollipop, heatmap, pareto, cycle plot,
  streamgraph, dumbbell, ridgeline, unit chart.
- Loop review: research took longest again, but for a new reason: the 2023
  Census topic releases published after May 2024 (religion, birthplace,
  commuting) carry no workbook downloads and point to the Aotearoa Data
  Explorer, which needs a subscription key. The ethnicity/culture release
  page has no DocumentLink in pageViewData, so viz-029, viz-049, and viz-050
  were skipped in favour of viz-013, viz-022, and viz-043, which all live in
  the one 2023 Census population counts workbook that still ships tables.
  The skill now says to check a release page for a BlockDocuments workbook
  before committing to a spec, since the census topic releases moved to ADE
  and guessed slugs 404.

## 2026-08-19 03:45 (NZST) - loop 11

- Handed off (unmerged, awaiting review): company-size-distribution (viz-079,
  branch feat/microsite-loop-11, review issue #237), tourism-arrivals-by-month
  (viz-083, branch feat/microsite-loop-11, review issue #238), and
  retail-sales-by-month (viz-086, branch feat/microsite-loop-11, review issue
  #239). A Pareto chart of enterprises by employment size group with an
  industry filter and measure toggle, a cycle plot of monthly overseas visitor
  arrivals with year toggles, and a streamgraph of monthly card spending by
  industry with layer toggles. Chart types pareto, cycle plot, and streamgraph
  are new to the site.
- Sources: Stats NZ "New Zealand business demography statistics: At February
  2025" (Table 1), "International travel" releases December 2018, December
  2019, and June 2025 (Table 2, monthly overseas visitor arrivals), and
  "Electronic card transactions" releases June 2023 and June 2025 (Table 1,
  actual monthly values). Every number was verified against the release
  workbooks before committing. All reference URLs return 200. Chart types used
  so far: line, area, bar, scatter, donut, treemap, map, histogram, radial,
  bubble, slope, timeline, funnel, waterfall, sunburst, lollipop, heatmap,
  pareto, cycle plot, streamgraph.
- Loop review: every Tier 1-2 chart type in the smoke-ranked doc was already
  used, and each remaining open issue maps to slope, histogram, or radial, so
  this loop introduced three chart types new to the site to honor the
  no-repeat rule. Research took longest: the retail trade survey is quarterly
  and its ADE tables need a subscription key, so viz-086 uses Stats NZ's
  monthly electronic card transactions series with copy that names the series
  exactly and says why. The births release slugs 404'd, so viz-082 was skipped
  for tourism and card data, which were verifiable from release workbooks.

## 2026-08-19 02:45 (NZST) - loop 10

- Handed off (unmerged, awaiting review): age-distribution (viz-074, branch
  feat/microsite-loop-10, review issue #229), median-age-ranks (viz-100,
  branch feat/microsite-loop-10, review issue #230), and
  visitor-arrival-ranks (viz-097, branch feat/microsite-loop-10, review
  issue #231). A histogram of the national age distribution with a census
  year slider, a slope chart of regional council median age ranks with a
  movers toggle, and a slope chart of visitor arrival ranks by country of
  residence with a movers toggle, built on a shared SlopeChart component.
- Sources: Stats NZ "2023 Census population counts (by ethnic group, age,
  and Maori descent) and dwelling counts" (Tables 6 and 7) and Stats NZ
  International travel: December 2019 (Table 4, visitor arrivals by country
  of residence, years ended December 2015 and 2019). Every age band,
  regional median age, and visitor arrival number was verified against the
  release Excel workbooks before committing. All reference URLs return 200.
  Chart types used so far: line, area, bar, scatter, donut, treemap, map,
  histogram, radial, bubble, slope, timeline, funnel, waterfall, sunburst,
  lollipop, heatmap.
- Loop review: the iteration resumed the stalled loop-10 work (a previous
  run hit the time cap at 01:59 and left WIP components on the branch), and
  the shared SlopeChart component had a rank-matrix transpose bug that
  mislabelled movers and hover summaries; both were fixed before pushing.
  The slower friction: main was found mid-merge with a stale unresolved
  conflict (merge: fix #142, left by an interrupted lane at 02:29, no agent
  working it). No live agent was touching main, so the merge was completed
  here after verification (tsc, vitest, lint, prettier) to unblock the
  changelog and prune steps. The skill now says a conflicted main (UU
  files) is the same category as dirty main: check for a live agent, then
  either resolve and commit the merge or abort it, never leave it half.

## 2026-08-19 00:55 (NZST) - loop 9

- Handed off (unmerged, awaiting review): quake-months (viz-081, branch
  feat/microsite-loop-9, review issue #223). A radial rose of earthquakes
  of magnitude 3 or stronger by calendar month, with year and magnitude
  filters, built on the GeoNet FDSN catalog (24 months, M3+).
- Sources: GeoNet FDSN event service (service.geonet.org.nz), earthquakes of
  magnitude 3 or stronger in the two years to 19 August 2026, fetched at
  build time and falling back to a committed snapshot of that catalog. All
  reference URLs return 200.
- Loop review: this iteration ran as a heal session because the loop had
  been blocked by uncommitted work and then a nested heal-session recursion
  (a heal session ran the wrapper while the launchd wrapper that spawned it
  was still alive, so the lock skip spawned another heal). The wrapper now
  exits quietly on a lock skip and refuses to spawn a second heal session,
  and the skill says a heal session should verify the guards and exit
  rather than run the wrapper while its parent wrapper is alive.

## 2026-08-18 23:15 (NZST) - loop 8

- Handed off (unmerged, awaiting review): quake-depth-scatter (viz-032,
  branch feat/microsite-loop-8, review issue #210), quake-frequency-magnitude
  (viz-040, branch feat/microsite-loop-8, review issue #211), and
  quake-depth-distribution (viz-090, branch feat/microsite-loop-8, review
  issue #212). All three draw on the GeoNet FDSN catalog: a magnitude-depth
  scatter with a day-window filter, a Gutenberg-Richter log-log scatter with
  a log/linear toggle, and a radial depth-band chart with a magnitude
  filter. The quake catalog now carries depth, so the committed snapshot was
  regenerated with it.
- Sources: GeoNet FDSN event service (service.geonet.org.nz), earthquakes of
  magnitude 1 or stronger in the three months to 18 August 2026, fetched at
  build time and falling back to a committed snapshot of that catalog. All
  reference URLs return 200. Chart types used so far: line, area, bar,
  scatter, donut, treemap, map, histogram, radial, bubble, slope, timeline,
  funnel, waterfall, sunburst, lollipop, heatmap.
- Loop review: the viz-090 spec story (deep quakes under the South Island)
  contradicted the data, which shows deep quakes clustering under the North
  Island, so the copy tells the honest version. The skill now says to check
  a spec's story claims against the fetched data before writing copy. The
  build also regenerated the committed CSP nonce files in the worktree,
  which blocked the rebase until they were restored; fix #205 has since
  stopped committing the nonce, so that friction is gone.

## 2026-08-18 22:20 (NZST) - loop 7

- Handed off (unmerged, awaiting review): regional-population-ranks (viz-091,
  branch feat/microsite-loop-7, review issue #202), export-destination-ranks
  (viz-093, branch feat/microsite-loop-7, review issue #203), and
  city-population-ranks (viz-096, branch feat/microsite-loop-7, review issue
  #204). All three are slope charts with a movers/all toggle and hover
  highlight, built on a shared SlopeChart component.
- Sources: Stats NZ 2023 Census population counts release (Table 1 regional,
  Table 2 territorial authority) and Stats NZ goods and services trade by
  country releases (year ended March 2015/2020 map data, International trade
  December 2025 quarter monthly series for 2026). All reference URLs return 200. Chart types used so far: line, area, bar, scatter, donut, treemap,
  map, histogram, radial, bubble, slope, timeline, funnel, waterfall,
  sunburst, lollipop, heatmap.
- Loop review: the smoke-ranked doc says slope is the only unused chart
  type, but loop 5's species-record-ledger already drew a two-point slope
  with a LineChart, so the changelog registry and the smoke-ranked doc
  disagree. The loop built three slope microsites anyway because slope is
  the highest-value next build per the smoke-ranked doc. The viz-091 spec
  story (Queenstown climbed) is TA-level, but the region-level ranks are
  frozen across all three censuses, so the copy tells the honest
  frozen-pecking-order story. Data sourcing took longest: the ADE needs a
  subscription key for census and trade tables, so the numbers were pulled
  from Stats NZ release Excel/CSV downloads instead.

# Changelog

## 2026-08-18 10:35 (NZST) - loop 5

- Shipped: backyard-species-census (live iNaturalist census, bubble chart by
  species, observations, and observers per group with taxon toggles),
  species-record-ledger (live GBIF occurrence search, slope chart by kingdom
  2014 vs 2024 with kingdom toggles), and what-the-world-reads (live Wikipedia
  pageviews, range timeline of daily views per NZ topic with a window slider).
- Sources: iNaturalist API (New Zealand place 6803), GBIF occurrence search
  (country NZ), and English Wikipedia pageviews API, all live from the
  browser (CORS open). Chart types used so far: line, area, bar, scatter,
  donut, treemap, map, histogram, radial, bubble, slope, timeline.
- Loop review: the launchd quality loop committed to main mid-run again, so
  the worktree branch was based on a stale main; the rebase onto origin/main
  went cleanly this time. The bigger slowdown was node_modules: symlinking
  the main repo's node_modules into the worktree breaks vitest's esbuild
  ("too many levels of symbolic links"), so a full npm install in the
  worktree was needed (~70s). The skill now says to run npm install in a
  fresh worktree instead of symlinking.

## 2026-08-18 09:45 (NZST) - loop 4

- Shipped: digitised-memory (live DigitalNZ search, histogram by decade with
  decade-range sliders) and online-garage-sale (live Trade Me category tree,
  radial bar by leaf count with search and expand).
- Sources: DigitalNZ (National Library) v3 API and Trade Me public category
  tree, both live from the browser (CORS open). Chart types used so far:
  line, area, bar, scatter, donut, treemap, map, histogram, radial.
- Loop review: the launchd quality loop committed to main mid-run (live-search
  timeout fix), so the worktree branch was based on a stale main and the new
  fetchers had to be reconciled with the timeout pattern. The skill now says
  to fetch origin and rebase onto the latest main before merging. Splitting
  shared infra (fetchers, accents) across per-microsite commits is fiddly;
  commit it with the first microsite.

Every microsite loop appends a dated entry here. Format:

## YYYY-MM-DD HH:MM (NZST) - loop N

- Shipped: <microsite slug> - <one line>
- Sources: <data source + references>
- Loop review: <what slowed the loop, what changed in the skill>

## 2026-08-18 01:55 (NZST) - loop 3

- Shipped: species-register (live NZOR search, donut by class) and
  open-data-catalogue (live data.govt.nz search, treemap by publisher).
  Both search from the browser (CORS open), so no build-time snapshot.
- Sources: NZOR (170,151 names) and data.govt.nz CKAN (31,915 datasets);
  DOC and Te Ara references.
- Loop review: client components cannot import @uk-open-data-lab/nz-sources (its
  fixtures read node:fs, which breaks the client bundle), so the browser
  fetchers live in apps/web/src/lib/live-sources.ts. A future refactor
  should split nz-sources into server and client entries to remove the
  parse overlap. Chart types used so far: line, area, bar, scatter, donut,
  treemap, map.

## 2026-08-18 00:40 (NZST) - loop 2

- Shipped: shake-index reworked from a scatter chart to a Leaflet map of
  New Zealand (OpenStreetMap tiles, bubble size by magnitude, colour by felt
  intensity, magnitude and depth sliders).
- Sources: GeoNet API; react-leaflet v5 + leaflet 1.9.4 (client-side only
  via next/dynamic ssr:false so the static export stays server-safe).
- Loop review: the first Leaflet attempt broke prerender (window at module
  load); the fix was splitting the map into a dynamic client-only module
  and keeping shared helpers Leaflet-free. Chart-type registry still needs
  building.

## 2026-08-18 00:05 (NZST) - loop 1

- Shipped: shake-index - recent felt quakes as an adjustable bubble chart
  (magnitude and depth sliders, colour by felt intensity).
- Sources: GeoNet API via @uk-open-data-lab/nz-sources (first non-Stats-NZ microsite);
  GeoNet FAQ and Te Ara references.
- Loop review: first worktree run. npm install in a fresh worktree is slow
  (node_modules rebuild); the runner script should reuse the main
  node_modules or document the cost. Chart type repeated (scatter) because
  the story demanded it; the skill needs a chart-type registry to make that
  a conscious choice.

## 2026-08-17 23:40 (NZST) - loop 0

- Shipped: kiwifruit-overtake, deer-boom-bust, dairy-takeover scatter view
  (the batch that preceded the loop).
- Sources: Stats NZ AGR_AGR_002 / AGR_AGR_003.
- Loop review: loop skill created; first run will test the worktree flow.
