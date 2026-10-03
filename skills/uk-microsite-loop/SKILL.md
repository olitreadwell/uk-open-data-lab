# uk-microsite-loop

A 20-minute autonomous loop that turns NZ public data into a new microsite:
research, build, test, merge, deploy, changelog, then review the loop itself
and improve this skill. Versioned in the repo so every iteration can make the
next one faster.

## When to use

- The user asks to "loop", "fan out and build microsites", or "keep shipping
  data stories".
- A new NZ data source or story idea needs to become a shipped microsite.

## Loop contract (one iteration, ~20 minutes)

Aim for 2-3 microsites per loop, batched in one worktree branch with one
commit per microsite, then one merge and one deploy.

1. **Research (5 min)**: pick 2-3 open `data-viz-idea` issues
   (`gh issue list --label data-viz-idea --state open`), highest priority
   first (`priority-high`, then `priority-medium`, then `priority-low`;
   tie-break by the order in `docs/backlog/data-viz-ideas-smoke-ranked.md`).
   Read the issue's own spec doc under `docs/backlog/data-viz-ideas/`
   (`viz-0XX-<slug>.md`) for the full spec; the issue body is the summary.
   Fan out with parallel subagents when the stories need external facts.
   Verify every reference URL returns 200 before linking it. Never fabricate
   a stat.
2. **Stories (2 min)**: one short story per microsite, oli-style copy (no
   em dashes, no puffery, real verified numbers, named sources).
3. **Build (8 min)**: one new microsite per source under
   `apps/web/src/app/microsites/`. Each needs a chart type not already used
   on the site (line, area, bar, scatter, bubble, slope, timeline, map) and
   an interaction: a slider, a toggle, a search, a brush, or a filter.
   Reuse `MicrositeStory`, `StatCard`, `MicrositeReferences`, and the
   accent system. Add a unit test per new component. Add each microsite to
   the home-page cards array in `apps/web/src/app/page.tsx` in the same
   commit: loops 11 and 12 skipped this and their microsites were
   unreachable except by direct URL.
4. **Verify (3 min)**: `npx tsc --noEmit` and `npx vitest run` in
   `apps/web`, lint the changed files. Fix errors before merging.
5. **Hand off (2 min)**: worktree + branch, one Conventional Commit per
   microsite, verify, then push the branch to `origin` and file one
   `microsite-review` issue per microsite instead of merging. The issue body
   names the branch, the spec doc, what was verified, and the smoke
   assertions; the quality loop reviews and merges it. Do not merge to
   `main`, do not close the `data-viz-idea` issue, do not deploy. Before
   pushing, run `git fetch origin` and rebase the branch onto `origin/main`
   if it moved while you built: the launchd quality loop commits to `main`
   concurrently, and a stale base makes the merge fight the new code. Push
   fast-forward when `origin/main` is an ancestor of your branch; only
   rebase when the tree is clean, and never rebase with unstaged changes.
   In a fresh worktree, run `npm install` before the checks: symlinking the
   main repo's `node_modules` into the worktree breaks vitest's esbuild
   with "too many levels of symbolic links". After pushing, `cd` to the
   main repo and remove the worktree so the next iteration starts clean.
   Issue template:
   `gh issue create --label microsite-review --label priority-<tier> --title "microsite-review: <slug> (<viz-id>)" --body "Branch: <branch>\nSpec: docs/backlog/data-viz-ideas/<viz-id>-<slug>.md\nVerified: tsc, vitest, lint\nSmoke: <assertions>\nReview and merge to main, curl the page for 200, then close this issue and the data-viz-idea issue."`
6. **Changelog (1 min)**: append one dated entry to `CHANGELOG.md` listing
   every microsite handed off in the loop, with its branch and issue number.
7. **Prune (1 min)**: before the wrap-up (compact), run
   `scripts/prune-loop-artifacts.sh` once. It removes merged
   `feat/microsite-loop-*` worktrees and branches and kills stale agent
   processes left inside them by stalled runs. It never touches `fix/*`
   (the quality loop's active lane) or `main`, and it skips dirty worktrees
   so a stalled agent's in-progress work is never destroyed. Make sure any
   subagents you spawned have finished before you wrap up.
8. **Review (1 min)**: read the last loop's notes, list what slowed it down,
   and update this skill with one concrete improvement. Keep the skill
   short; delete rules that no longer pay for themselves.

## Hard rules

- Every microsite must come from an open `data-viz-idea` issue; never build
  a microsite outside the issue queue.
- Microsites are handed off unmerged as `microsite-review` issues; the
  quality loop merges them. Never merge a microsite to `main` yourself.
- 2-3 microsites per loop, one chart type per microsite, no repeated chart
  types across the site unless the story demands it. Keep a running list of
  chart types used in the changelog so the next loop picks a fresh one.
- Every number in the copy must come from the data or a verified source.
- Every reference URL must return 200 (curl before commit).
- No `console.log`, no `any`, explicit return types, npm only.
- Never delete or weaken a failing test to get green.
- If a loop fails three times on the same blocker, stop, document the
  blocker in the changelog, and ask the user one precise question.

## Self-healing (the loop fixes itself)

The wrapper (`scripts/run-microsite-loop.sh`) tracks consecutive skips in
`~/Library/Logs/uk-microsite-loop-state.json`. After 3 skips in a row it
stops waiting and spawns a "heal the loop" session
(`scripts/heal-loop-prompt.txt`) that:

1. Reads the log and state file to find the blocker.
2. Fixes the root cause in the wrapper, the skill, or `.gitignore`.
3. Records the lesson in this skill.
4. Commits and pushes the fix, then runs one normal iteration if possible.

This is why the review step is not only for shipped loops: a loop that
cannot ship must still be able to improve itself. If a blocker repeats,
fix the guard or the skill rather than working around it by hand.

A heal session is itself spawned by a wrapper run, so it must not run the
wrapper while the launchd wrapper that spawned it is still alive: the lock
guard sees the parent wrapper's PID and skips, and the accumulated skips
then spawn a nested heal session (wrapper -> heal A -> manual wrapper run
-> heal B), recursing until the chain unwinds. The wrapper refuses to
spawn a second heal session while one is running, but the heal session
should still avoid the manual run: verify the guards (bash -n, guard
logic, clean main) and exit; the parent wrapper resets the skip state and
the next launchd tick runs the iteration. Only run the wrapper yourself
when no wrapper is already running (check the lock file first).

## Known blockers

- The quality loop appends its daily notes to
  `skills/quality-issue-loop/LOOP-NOTES.md` and does not always commit them
  before its iteration ends. An uncommitted notes entry used to make the
  dirty-main guard skip every tick; the wrapper now excludes that file (like
  `next-env.d.ts`), so notes left behind never block this loop. Git still
  refuses a merge that would overwrite a dirty file, so the safety net stays
  intact. If the loop skips for a dirty main again, the wrapper logs the
  dirty file list, so read that line before changing the guard.

- A stalled run can leave a clean worktree with committed microsites that
  were never pushed or handed off (the agent hit the time cap after
  committing but before the push and issue steps). Before starting fresh,
  check for a clean, unmerged `feat/microsite-loop-*` worktree and resume
  it: verify its commits (tsc, vitest, lint), rebase onto origin/main,
  push, file the review issues, then build any remaining microsites to fill
  the 2-3 batch. Loop 14 resumed loop 14's stalled work this way: two
  committed microsites were verified and handed off, and a third was built
  from the next open issue with a proven source.

- A heal session that runs the wrapper manually while its parent wrapper is
  still alive recurses: the manual run skips on the lock (the parent holds
  it) and the accumulated skips spawn a nested heal session. The wrapper
  now guards against a second heal session, and the heal session should
  verify the guards and exit instead of running the wrapper when the
  launchd wrapper that spawned it is still running (see Self-healing).

- Completed work left uncommitted on main blocks every tick: an interactive
  experiment session built the rabbit-boom microsite directly on main and
  handed off with "commit when ready", but nothing committed it, so the
  dirty-main guard skipped for over an hour. When the heal session sees
  "main has uncommitted changes", tell stale completed work from a live
  concurrent lane before touching anything: check for a running agent
  touching those files (ps for codex/claude, session file mtimes), and
  check whether the work is idle and verified (type-check, vitest, lint).
  If it is stale and verified, commit it with a Conventional Commit message
  and stage only the files that belong to that change; never stage another
  lane's dirty files (LOOP-NOTES.md stays excluded). Scratch files from the
  verification pass (tmp-*.mjs and similar) are not part of the
  deliverable; remove them rather than committing them. If an agent is
  actively working, do not fight it: document the situation and exit.

- A lane that dies mid-merge leaves main in a conflicted state (UU files,
  staged fixes, MERGE_HEAD set) with no process working it. The wrapper's
  dirty-main guard catches this as dirty on the next tick, but the loop
  wastes a tick waiting it out, and the stale merge blocks the changelog
  and prune steps. Treat a stale conflicted merge like stale uncommitted
  work: check ps for a live agent touching main, then either resolve the
  conflicts (git diff on the UU files, keep the newer landmark structure
  when the merge base is old), verify with tsc/vitest/lint/prettier, and
  commit the merge with `git commit -m "merge: fix #N"` (the repo's
  configured editor may not exist headless), or `git merge --abort` if the
  intent is unclear. Never leave a merge half-done when a run is near its
  time cap: commit or abort before the wrapper kills the session.

- A lock skip must never spawn a heal: the wrapper's lock-skip path used to
  call maybe_heal, so while a heal session held the lock (the wrapper waits
  on it synchronously), every 20-minute tick saw a live lock, skipped, and
  spawned another heal. Two heal sessions then diagnosed the same blocker
  concurrently. A live lock means an iteration or heal is already running,
  which is active work, not a blocker; the wrapper now exits quietly on a
  lock skip. If you see a second heal session in the log, let it finish and
  reconcile its changes rather than fighting it.

- Spec stories can contradict the data: viz-090's spec claimed deep quakes
  cluster under the South Island, but the catalog shows them clustering under
  the North Island (the Hikurangi subduction story). Check a spec's story
  claims against the fetched data before writing copy, and tell the honest
  version when they disagree. The smoke-ranked doc's assertions are the safer
  guide than the one-line story.

- GeoNet FDSN caps each query at 10,000 events (HTTP 413 "Request Entity
  Too Large"): magnitude 1 or stronger only fits about 5 months, so a
  seasonal "by month" story needs a higher floor. Magnitude 3 or stronger
  fits 24 months (about 6,900 events), which is enough for a monthly rose
  with a year filter. Commit a snapshot of the exact query the chart uses
  (same magnitude floor and window) so the fallback matches the copy.

- Stats NZ ADE data is not keyless beyond the AGR_* tables: census and trade
  dataflows return 401 without a subscription key. For those, pull the
  numbers from the release page instead: fetch the release HTML, read the
  `pageViewData` JSON for the `DocumentLink` of the xlsx/csv download, then
  parse the sheet. The 2023 Census release's Table 1 (regional) and Table 2
  (territorial authority) are the fastest path to census rank data, and the
  "Goods and services trade by country" release's map CSV has exports by
  country for the years ended March 2015-2020. Verify every number against
  the source before committing; the smoke-ranked doc's chart-type claims can
  lag the changelog (it still calls slope unused after loop 5 shipped one),
  so trust the codebase over the doc when they disagree.

- The 2023 Census topic releases published after May 2024 (religion, ethnicity,
  commuting, birthplace, income) carry no workbook downloads: their release
  pages have no `BlockDocuments` in `pageViewData` and point at the Aotearoa
  Data Explorer, which needs a subscription key. Check a release page for a
  `BlockDocuments` workbook before committing to a spec, and prefer the
  "2023 Census population counts (by ethnic group, age, and Maori descent)
  and dwelling counts" workbook (published 29 May 2024), which still ships
  17 tables covering region and TA population (Tables 1-2), ethnicity by
  region (Tables 4-5), age bands national and by region (Tables 6-7), and
  Maori descent (Tables 10-11). Loop 12 built three microsites from that one
  workbook with verified numbers.

- The keyless monthly series map: the retail trade survey is quarterly and its ADE
  tables need a subscription key, so the monthly retail pulse is Stats NZ's
  "Electronic card transactions" releases (Table 1, series ECTM, ~2 years per
  release; combine June 2023 + June 2025 for June 2021 to June 2025). Monthly
  overseas visitor arrivals are in "International travel" release Table 2
  (December releases span June of the prior year to December; combine December
  2017/2018/2019 with a 2025 release for 2017-2019 plus 2024, which skips the
  COVID years cleanly). Births-by-month release slugs were not findable
  (guessed slugs 404), so viz-082 stayed unbuilt. All three release xlsx files
  are reachable via the pageViewData DocumentLink pattern. As of loop 11 every
  open data-viz-idea maps to slope, histogram, or radial, so loops must
  introduce chart types new to the site (pareto, cycle plot, and streamgraph
  shipped in loop 11) instead of following the spec's chart line literally.

## Loop review checklist (step 8)

- What took longest? (research, build, verify, deploy)
- Did the chart type repeat? Did the copy need rewriting?
- Did any reference URL 404 after deploy?
- Did the worktree/branch flow add friction? Would a script help?
- Is there a new adapter or fixture worth adding to `@uk-open-data-lab/nz-sources`?
