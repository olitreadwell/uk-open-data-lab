# quality-issue-loop notes

Dated history of each iteration and the skill improvements it produced.

## 2026-08-18 (iteration 1, manual)

Generated 6 issues from a11yproject, Front-End Checklist, and OWASP
checklists (#11, #13-#17). Shipped 4 fixes via worktree fan-out: favicon
(#9), quake-map default filter (#7, root cause: 63/100 live felt quakes have
magnitude < 3 but the default filter hid them), deer chart y-axis duplicate
ticks (#2), skip-to-content link (#11). All merged to main, CI build +
type-check passed, Pages deploy verified, issues closed.

Blockers found and fixed this iteration:

- launchd environment was missing OLLAMA_CLOUD_MAX_API_KEY, so every scheduled
  `codex exec` died at startup for ~6 hours before diagnosis. Fix: write the
  provider env vars into the launchd plist EnvironmentVariables.
- The Next.js build cannot run inside a git worktree (turbopack refuses to
  resolve `next` from a symlinked/absent node_modules). Fix: worktree
  verification is type-check + lint + test; the build runs in CI on merged
  main.
- `fanout()` did not await its child processes, so every agent was reported
  as failed and the run aborted. Fix: async fanout with awaited exit codes.
- Check for uncommitted changes on main before fan-out; defer fixes whose
  files are dirty (breadcrumbs issue #8 was deferred for this reason).

Skill improvements adopted: document the launchd env requirement, the
no-build-in-worktree rule, and the dirty-tree check in SKILL.md.

## 2026-08-18 (iteration 2, launchd-triggered)

Generated #23-#27 (footer count mismatch, missing <h1> on microsite pages,
deploy-time fetchers without timeout, untested browser parsers, duplicated
hardcoded headline stats). Pooled with the open backlog, prioritized by
label, and implemented 4 fixes via worktree fan-out: error boundary leak
(#19), chart data tables for keyboard users (#18), quake map keyboard
access (#22), live-search timeout/abort (#21). All merged, CI build +
type-check green, Pages deploy verified, issues closed.

Fixes to the loop itself this iteration:

- `fanout()` awaited child exit codes AFTER spawning, so a child that had
  already exited never resolved and the whole run aborted. Fix: attach exit
  listeners at spawn time and await the captured promise.
- launchd environment is a different world: provider API keys must be in
  the plist EnvironmentVariables or every codex exec dies at startup.
- Added a triage step: every pass now reviews ALL open quality-loop issues,
  refreshes bodies and priority labels, closes stale/already-fixed issues,
  and merges duplicates (e.g. two hover-tooltip issues) into one primary.
- Generation now scores findings by severity (security/a11y = high) and
  files the highest-severity ones first, so early iterations surface more
  high-priority work.

## 2026-08-17

Generated 5 issues, merged 4 fixes (#30, #14, #32, #27).

## 2026-08-18 (report-an-issue feature)

Added a floating report-an-issue bubble to every page
(apps/web/src/components/ReportIssueButton.tsx). It opens a small dialog
(type, item, description) and builds a prefilled GitHub new-issue URL with
page URL, title, timestamp, and user agent, so the reporter reviews and
submits on GitHub (a static export cannot hold a token). Triage now reviews
ALL open issues, not just quality-loop-labeled ones, so user reports get
spec'd, labeled, prioritized, and fixed by the loop. Also fixed: GitHub
Pages does not serve .well-known paths, so security.txt ships at the root.

## 2026-08-18 (hide-first rule)

New hard rule from the user: the moment a bug is filed against a microsite,
that microsite comes off the site (highest priority) and stays hidden until
the fix ships. Implemented:

- `apps/web/src/lib/hidden-microsites.ts` — `HIDDEN_MICROSITES` array plus
  `withHiddenMicrositesRemoved`; `microsites.ts` filters through it, so a
  hidden slug disappears from the home grid, the report-button item list,
  and `generateStaticParams` (direct URLs 404).
- Home page (`apps/web/src/app/page.tsx`) refactored from 14 hardcoded card
  blocks to a filtered card list so hiding one cannot crash the build.
- Loop script: triage verdicts can carry `microsite` + `hide`; the script
  hides (commit + push + deploy) immediately during triage. Fan-out agents
  un-hide as part of the fix.
- Applied: #154 (shake-index map z-index over the report dialog) -> shake-index
  hidden, verified 404 on the deployed site; fix pending in the loop.

## 2026-08-18

Generated 5 issues, merged 4 fixes (#159, #156, #155, #149).

## 2026-08-18

Generated 5 issues, merged 4 fixes (#180, #179, #176, #175).

## 2026-08-18 (un-hide sprint)

Fixed every open bug blocking a hidden microsite and brought all 9 back
live: shake-index (#154 map stacking context), what-the-world-reads (#150
logPosition guard), digitised-memory (#169 undated-record filter),
backyard-species-census + species-record-ledger (#151 live-fetch isolation
and concurrency cap), open-data-catalogue (#145 stale-response guard),
species-register (#171 NZOR /names/search endpoint), auckland-parks (#168
board filter label), vineyard-boom (#4 closed as not-a-bug: data is
genuinely hectares and labeled). Also merged the in-flight fan-out fixes
(#160, #161, #164, #165, #166, #167, #148) and added hub cards for
river-lengths, peak-heights, and auckland-parks (#184). All 17 microsites
live, CI green, issues closed.

Loop fixes this iteration:

- Fan-out agents un-hid microsites their fix did not cover (e.g. #166
  un-hid shake-index/digitised-memory/what-the-world-reads whose real
  blockers were still open). The fan-out prompt says "if this issue names a
  microsite, remove it from hidden-microsites.ts", which agents over-apply
  when an issue merely mentions a component. Fix: only un-hide when the
  issue body carries an explicit "Hide-first" section naming the slug.
- Sequential merges of branches that each edit hidden-microsites.ts
  conflict because every branch is based on the same old main. Resolving
  each conflict by hand is mechanical; the script could merge the hidden
  list itself (union of removals) before merging branches.

## 2026-08-18 (merge + cleanup)

Merged the preserved data-viz branch feat/microsite-loop-8 after rebasing
onto main and fixing its stale tests and one lint error: shipped
open-school-map, canterbury-rain, and hamilton-playgrounds microsites, plus
hub cards for all three (home page now shows all 20 microsites). Cleaned up
every merged worktree and branch: 14 fix/* branches (#148-#171) and
feat/microsite-loop-8 removed via git and Orca. Left preserved:
feat/microsite-loop-7 (broken WIP: microsites.ts has orphaned reference
blocks and missing configs for road-crash and vehicle-fleet) and
feat/microsite-loop-9 (dirty WIP: uncommitted AgePyramid work; its committed
hide commit is already in main).

## 2026-08-18 (loop-9 shipped)

Rebased feat/microsite-loop-9 onto main (resolved both conflicts by keeping
both case/config blocks), verified type-check + 192 unit tests + lint (0
errors), merged, added hub cards for census-rank-shift, age-pyramid, and
quake-magnitudes, bumped the e2e card count 20 -> 23, built, pushed, and
watched the Pages deploy go green. All three new pages return 200. Removed
the loop-9 worktree and branch. Home page now shows 23 microsites.

## 2026-08-18 (loop-7 shipped)

Rebased feat/microsite-loop-7 onto main (resolved conflicts in live-sources,
microsites configs, page cases, and tests by keeping both sides), restored
the missing road-crash-trend and vehicle-fleet config objects from the
stale .full backups, verified type-check + 217 unit tests + lint (0
errors), merged, added hub cards for ev-charging, road-crash-trend, and
vehicle-fleet, bumped the e2e card count 23 -> 26, built, pushed, and
watched the Pages deploy go green. All three new pages return 200. Removed
the loop-7 worktree and branch. Home page now shows 26 microsites.

## 2026-08-18 (smarter report-an-issue dialog)

Made the report-an-issue dialog gather more context: it now auto-detects
the current microsite from the URL and preselects it in the Item dropdown,
adds a Severity field (Blocks me / Annoying / Cosmetic / Not sure) and an
optional "What did you expect?" field, and appends an Environment section
(browser, OS, viewport, color scheme, online state, URL) plus the selected
microsite's dataNote as Data context to the prefilled issue body. Verified
with 9 unit tests (incl. axe) and a live Playwright smoke test on the
deployed site: item preselection, prefilled URL, and all body sections
present. Deployed green.

## 2026-08-18

Generated 5 issues, merged 1 fixes (#143).

## 2026-08-18 (un-hide batch: NZOR total, open-data count, Overpass timeout, responsive charts)

Merged 4 fan-out fixes that un-hid all 5 remaining hidden microsites:

- #181 real NZOR register total (empty query returns full Total; parseNzorNames
  now throws on non-finite Total / malformed Names) -> species-register live.
- #191 real CKAN match count in open-data search -> open-data-catalogue live.
- #201 Overpass timeout raised to 60s with cleared abort timer -> open-school-map live.
- #183 ResponsiveContainer for auckland-parks + peak-heights charts -> both live.
  Closed 6 triage duplicates (#20->#163, #25->#182, #39->#177, #195->#181,
  #35/#38->#142) and raised the un-hide batch to priority-high. HIDDEN_MICROSITES
  is now empty; all 26 microsites live, CI fully green (incl. all E2E shards),
  deployed, every page 200.

Loop fixes this iteration:

- The fanout script's sequential merge broke on hidden-microsites.ts (every
  branch removes a different slug from the same list, based on old main). The
  script caught the conflict, logged, and CONTINUED, leaving main with a
  half-merged conflicted index, then pushed the partial state. Resolved by
  hand (union of removals). Fix: teach fanout to auto-resolve hidden-microsites.ts
  conflicts as the union of both sides' removals before/while merging.
- The #199 axe-scan fan-out agent hung 40 min on a Playwright run against a
  dead local dev server (0% CPU, no child processes). Had to kill it and
  finish the fix manually (also found the muted-text token failed AA on tinted
  cards: 373 hub violations; darkened --color-muted to neutral-600).
- The #197 CSP generate-csp.mjs rewrites tracked files (public/_headers,
  vercel.json) with a fresh nonce on every build, leaving the working tree
  dirty after any local build. Worth making those files build-time-only.

## 2026-08-18

Generated 5 issues, merged 4 fixes (#208, #207, #206, #205).

## 2026-08-19

Generated 5 issues, merged 4 fixes (#222, #217, #215, #213).

## 2026-08-19

Generated 5 issues, merged 3 fixes (#225, #224, #218).

## 2026-08-19

Generated 5 issues, merged 4 fixes (#235, #234, #233, #232).

## 2026-08-19

Generated 5 issues, merged 4 fixes (#246, #245, #244, #243).

## 2026-08-19 (manual batch + microsite merge, outside the schedule)

Fan-out batch (#268 leaflet focus, #271 treemap a11y, #270 iNaturalist
deadline, #267 CSP style-src): first three merged and pushed; #267's fan-out
agent commit was lost when the fan-out script died on a broken `gh` symlink
(worktree + branch deleted before merge), so the fix was re-implemented by
hand. The CSP fix now drops `'unsafe-inline'` from `style-src` entirely:
generate-csp.mjs stamps the per-build nonce into every inline style
attribute and both CSP sources serve `style-src 'self' 'nonce-…'`; the
deploy check asserts the style nonces round-trip.

Merged all 9 microsite-loop branches sequentially into main (9, 7, 8, 10,
11, 12, 13, 14, 15), keeping both sides on merge conflicts
(microsites.ts, page.tsx, home page, hidden-microsites union rule,
add/add files combined). Branch merges surfaced two pre-existing build
breaks that the loop's no-build-in-worktree gate had missed:

- client charts importing node:fs fixture modules (QuakeMonthRose,
  QuakeYearStripChart, RegionDensityChoropleth) broke the Turbopack static
  build; split the pure month-binning helpers out of quake-month-data.ts
  and switched the quake-year and region-density fixtures to JSON imports
  (renamed the GeoJSON to .json).
- the quake month fixture gained real depths (t/m/d rows) to satisfy the
  now-required depthKm on QuakeCatalogEvent; regenerated from the live FDSN
  service over the same 24-month window, story numbers unchanged.

Deploy infrastructure was broken: the Vercel GitHub Actions secrets were
empty and the site had been 404ing, and the Vercel project settings had
been reset (no rootDirectory/outputDirectory), so `vercel build` failed
with "No Output Directory named public". Restored the three VERCEL_*
secrets from the local CLI token, set project rootDirectory=apps/web,
buildCommand="npm run build", outputDirectory="out", and pointed the
deploy's header check at the production domain (deployment URLs are
SSO-protected). The production site is live again with the strict CSP.

Skill improvements for next iterations: the loop must never trust a fan-out
merge that errored after the agent finished (verify the merge landed before
pruning the worktree/branch), and every merged branch needs a real
`next build` on a main checkout before deploy, not just type-check+test.

## 2026-08-19: CSP revert, viewport-height charts, hub filters, backlog closures

- The strict style-src CSP (9e90a90) broke charts: React runtime style writes
  (Recharts ResponsiveContainer, Leaflet) are blocked by nonce-only style-src,
  so chart wrappers stayed 0px. Reverted to 'unsafe-inline' for style-src only
  (ce59f21) and reopened #267 as a hardening follow-up (script-src stays
  nonce-based; the deploy header check keeps passing).
- Charts now size as a percentage of the device viewport height instead of
  fixed pixels: `h-[clamp(...vh,...px)]` on every chart wrapper and a
  `max-h-[clamp(320px,46vh,560px)]` cap on the proportional `h-auto w-full`
  SVGs; the VehicleFleet sunburst now sits in a ResponsiveContainer.
- The hub page gained client-side filters for data source, chart type, and
  category (any permutation, AND semantics), with taxonomy metadata added to
  every MicrositeConfig entry and a taxonomy integrity test.
- Closed 13 shipped data-viz-idea issues (median-age-ranks, visitor-
  arrival-ranks, city-population-ranks, unemployment-ranks, export-
  destination-ranks, regional-population-ranks, quake-depth-distribution,
  retail-sales-by-month, tourism-arrivals-by-month, quake-months, company-
  size-distribution, age-distribution, quake-magnitudes) plus the open
  quake-months microsite-review issue (#223), all verified live with HTTP 200
  and stat assertions. Protected labels data-viz-idea/data-tutorial untouched
  beyond these closures.

Addendum (same day): local browser QA caught a cascade-layer gotcha the unit
suite can't see: _global.scss sets `svg { width:100%; height:auto }` un-layered,
and Tailwind v4 utilities live inside `@layer utilities`, so un-layered rules
win -- chart SVGs ignored `h-full` and overflowed their wrappers (742px in a
368px wrapper). Fixed with an un-layered `svg.h-full { height:100% }` override
next to the default. Also: the hub chart sweep must assert real rendered
heights per chart type, not just class presence; choropleth/rose/bump/
parallel-coordinates all cap at <= 46vh now. Preview deploys (deploy_preview.
yml) are manual-only going forward to stop burning Vercel builds per PR.

## 2026-08-19 (iteration, manual)

- Routing overhaul: microsites moved from `/microsites/:slug` to
  `/category-slug/:slug` with category landing pages at `/category-slug/`
  (11 categories via `CATEGORY_SLUGS` in `apps/web/src/lib/microsites.ts`).
  The "All microsites" link is gone, replaced by a breadcrumb
  (`nav[aria-label="Breadcrumb"]`) on story pages that links back to the
  category page. Old routes 404; verified live.
- Contrast overhaul: every accent now has `--accent-<name>-fg/bg/border`
  tokens in `packages/ui/src/tokens/tokens.css` for both `:root` and `.dark`
  (light fg `oklch(0.45 0.13 <hue>)`, dark fg `oklch(0.82 0.12 <hue>)`).
  `microsite-styles.ts` maps accents to these tokens, the section gradient
  (`sectionBg`) is gone (plain bordered sections), and a token-level contrast
  test asserts 4.5:1 for every accent on light and dark page/card backgrounds.
- Chart sweep: ~23 chart components plus shared libs
  (`quake-utils.ts`, `export-rank-data.ts`, `ethnicity-mix-data.ts`,
  `region-waffle-data.ts`) moved to the Okabe-Ito colorblind-safe palette
  (blue `#0072B2`, orange `#E69F00`, green `#009E73`, red `#D55E00`, pink
  `#CC79A7`). `region-density-data.ts` keeps its indigo choropleth ramp
  (sequential, not categorical).
- Verification: 467 unit tests pass, type-check clean, static build clean
  (11 categories + 51 stories prerendered), local route probe PASS, and axe
  WCAG A/AA reports 0 contrast and 0 other violations across 6 pages in both
  light and dark mode. Pushed to main in two commits; the single primary
  Vercel deploy succeeded and the live probe against
  https://nz-open-data-lab.vercel.app passes the same route + axe checks.
- CI advisory jobs (e2e shards, axe e2e, lint) still fail on GitHub runners
  with pre-existing issues (keyboard-focus tab-through assertion, stats-nz
  jsdoc/no-magic-number warnings); type-check, build, CodeQL, npm audit, and
  unit tests all pass, and those are the blocking gates. No preview deploys
  were created (deploy_preview stays manual-only).

## 2026-08-19 (iteration 2, manual): duplicate-page merges + category filters

- Dedup audit: mapped all 52 microsites to their chart components and data
  libs, then merged pages that plot the same underlying data. Six pairs
  became single pages that now show BOTH visualisations (kept slug shown):
  - `region-density` (choropleth) + `population-waffle` (waffle)
  - `regional-population-ranks` (slope) + `regional-population-growth`
    (dumbbell) - same regional census counts
  - `median-age-ranks` (slope) + `median-age-by-region` (tile grid)
  - `quake-magnitudes` (histogram) + `quake-frequency-magnitude` (cumulative
    log view)
  - `quake-depth-scatter` (scatter) + `quake-depth-distribution` (radial
    depth bands)
  - `export-destination-ranks` (slope) + `export-market-bump` (bump)
- Removed slugs 404; story pages render a labelled pair of charts
  (`storyChartPair` in the story page) and keep both pages' stat cards.
  Descriptions were rewritten so the four earthquake cards no longer share
  the "In the three months to 18 August 2026..." opener.
- Category pages now pre-set the Category filter (no "All categories"
  option) and Reset navigates to the hub (`/`) with every filter cleared.
- Verification: 468 unit tests pass, type-check and static build clean
  (45 visible story routes), local route/content probes pass, removed routes
  404, axe WCAG A/AA 0 violations on all 6 merged pages in light and dark.
  Deployed to Vercel; live probes pass. Remaining advisory CI failures are
  the pre-existing e2e/axe/lint ones; blocking gates (type-check, build,
  CodeQL, audit, unit) are green.

## 2026-08-19 (iteration 3, manual): second dedup batch + de-ai-text + km2 + live-source fixes

- Dedup batch 2: merged two more same-data pairs into single pages showing
  BOTH charts (46 -> 44 visible story routes):
  - `tourist-arrivals` folded into `visitor-arrival-ranks` (rank slope + dot plot)
  - `age-bulge` folded into `age-distribution` (histogram + ridgeline)
  - Removed slugs 404; both pages' stat cards kept; home page stat cards repointed.
- de-ai-text pass over all microsite copy: stripped emoji from all 44
  eyebrows, removed "This page shows..." framing and "Hover or drag across
  the chart..." boilerplate from descriptions/dataNotes, de-rule-of-three'd
  the home H1.
- Units: replaced hectares with km2 everywhere (`formatHectares` ->
  `formatAreaKm2`; Auckland parks m2 -> km2; narrative + dataNotes + tests).
- open-school-map: Overpass school fetch moved from browser to build time
  (`fetchSchoolsForBuild`), committed 2,604-school fixture as fallback; the
  map now renders with zero runtime dependencies and a status line saying
  the data came from OSM at build time.
- digitised-memory: DigitalNZ v3 sends no CORS headers, so the live search
  now routes through `cors.eu.org` relay (same JSON payload, verified);
  relay host added to CSP `connect-src` in `vercel.ts`, `public/_headers`,
  and the security-headers test.
- Verification: 467 unit tests pass, type-check clean, static build clean,
  local probe passes (404s, merged content, km2 text, OSM text, live
  DigitalNZ search, axe WCAG A/AA 0 violations on all 4 changed pages in
  light and dark). One final deploy only (no preview deploys). Advisory CI
  (e2e/axe/lint) still has pre-existing failures; blocking gates green.
