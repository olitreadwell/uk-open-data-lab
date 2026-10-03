# uk-open-data-lab

Small experiments digging through UK public data (Environment Agency, ONS, and
whatever else turns up something weird, funny, or surprising). Built
on a Next.js 16 + Turborepo monorepo template (originally numeralstudio/template) —
**npm + Turborepo + Next.js 16 + React 19.2 + TypeScript + Tailwind 4 + SCSS +
shadcn/ui + Zod + Lucide**.

Three goals at once, in order of what actually gets graded:

1. **Explore NZ public data** for the weird, funny, or surprising. Bar is low on
   purpose — many scrappy experiments beat one polished platform. Dead experiments stay
   listed, never deleted.
2. **Practice directing Claude (Sonnet) to orchestrate a cheaper model (Haiku)** for
   the mechanical parts of building each experiment.
3. **Turn what worked into tutorials** other people can use.

Never fabricate a data source, a stat, or a "this worked" claim.

The styling system is hybrid: Tailwind for layout, SCSS for component identity and
variants, shadcn/ui (Base UI primitives) for interactive components — all reading from
the same CSS-variable design tokens. Documented in detail in Storybook → Style Guide (8
chapters).

See `AGENTS.md` for global agent rules and quality gates.

## Package structure

- `apps/web` — Next.js app (`@uk-open-data-lab/web`)
- `packages/ui` — Shared layout primitives + canonical `Button` + shadcn/ui scaffold +
  style system (`@uk-open-data-lab/ui`)
- `packages/config-typescript` — Shared TypeScript configs
- `packages/config-eslint` — Shared ESLint configs (flat config, ESLint 9)
- `packages/config-tailwind` — Shared Tailwind theme + design tokens

## Commands

```bash
npm run dev            # Start dev servers
npm run build          # Build all
npm test               # Run unit tests
npm run test:coverage  # Tests with coverage (60% threshold)
npm run lint            # ESLint
npm run type-check      # TypeScript
npm run storybook       # Storybook on :6006
npm run clean:all       # Wipe node_modules + caches
```

## Styling system

Read this before writing UI code: **Storybook → Style Guide → 01 Overview** (and the
seven chapters that follow). The TL;DR:

- **Tokens**, split by owner — don't hand-roll a third set of variables elsewhere:
  - `packages/ui/src/tokens/tokens.css` — colors only, including the shadcn/ui color
    system and the brand/neutral scale.
  - `packages/config-tailwind/tokens.css` — spacing, radius, z-index, durations,
    easings. Drives the actual Tailwind utility scale (`p-4`, `rounded-md`, etc) via
    `@theme`, so `var(--radius-md)`-style arbitrary values and the `rounded-md` class
    always agree.
  - `packages/ui/src/styles/abstracts/_variables.scss` — a separate named
    section-spacing scale (`--spacing-xs` through `--spacing-4xl`), used for page/section
    rhythm (`py-[var(--spacing-3xl)]`) rather than fine-grained component spacing.
- **Tailwind utilities** for layout, spacing, simple states — `flex items-center gap-4`.
- **SCSS classes** for component identity and variants — `.numeral-button`,
  `.numeral-heading-2xl`. All custom classes start with `numeral-`, BEM-flat-dash
  naming, no double-dashes. (The `numeral-` class prefix is a leftover from the base
  template's naming and hasn't been renamed — it's cosmetic, not a package reference,
  so it's left alone.)
- **`cn()` helper** (`packages/ui/src/lib/cn.ts`) to combine them in a readable order:
  identity → layout → state → caller's `className`.

Folder mirror is required: every styled component `Foo.tsx` has a matching `_foo.scss`
in `src/styles/components/`, wired into `main.scss` via `@use`.

The canonical example is `packages/ui/src/components/Button.tsx` +
`packages/ui/src/styles/components/_button.scss`. Copy that pattern when building new
components in the hybrid Tailwind/SCSS system.

## shadcn/ui

`packages/ui/components.json` is the real config (`base-nova` style, Base UI, Lucide
icons). `npx shadcn add <component>` only works run from `apps/web` — the CLI's
framework detection doesn't recognize `packages/ui` as a standalone project in this
monorepo layout. After adding a component there, move the generated file into
`packages/ui/src/components/ui/`, point its `cn` import at `@/lib/cn` (packages/ui's
existing util, not a new `lib/utils.ts`), and don't export it from
`packages/ui/src/index.ts` unless it's meant to replace or extend the public surface —
see the comment atop `packages/ui/src/components/ui/button.tsx` for why a shadcn
`Button` coexists with the canonical one without conflicting.

## SCSS abstracts (`packages/ui/src/styles/abstracts/`)

- **`_breakpoints.scss`** — `$bp-360` through `$bp-1850`
- **`_mixins.scss`** — `breakpoint-below/above/between()`, `touch()`, `hover()`,
  `reduced-motion()`, `container-query-min/max()`, `keyframes()`, `animate()`
- **`_functions.scss`** — `pxToRem($px)`, `fluid-px($min, $max, $minVw, $maxVw)`
- **`_typography.scss`** — `.numeral-heading-*`, `.numeral-paragraph-*`,
  `.numeral-text-*` classes

## What's in `@uk-open-data-lab/ui`

```ts
import { Box, Button, cn, Container, Flex, Grid, HStack, Section, Stack, VStack } from '@uk-open-data-lab/ui';
```

That's the public surface. We don't pre-ship dialogs, dropdowns, tables, etc as public
exports — when you need an interactive primitive, scaffold it via `npx shadcn add`
(see above) and style following the Button pattern.

## Experiments

Every experiment is a self-contained route at
`apps/web/src/app/experiments/<slug>/`, with its own `error.tsx` boundary so a broken
one doesn't take the rest of the site down. Copy
`apps/web/src/app/experiments/_example/` to start a new one — it has `page.tsx`,
`error.tsx`, `README.md` (pitch/data source/verdict), `ORCHESTRATION.md` (the
Sonnet→Haiku handoff record), and `TUTORIAL.md` (the outside-reader writeup, written
last). Register shipped experiments in `apps/web/src/lib/experiments.ts` and
`INDEX.md`; tutorial-worthy ones also go in `TUTORIALS.md`.

Optional, per-experiment libs already installed in `apps/web` but not required
everywhere: gsap, three, `@react-three/fiber` + `drei` + `postprocessing`, leva — reach
for these only on experiments that actually need animation or 3D.

## Testing

- **Unit**: Vitest + `@testing-library/react` + `jest-axe` for a11y assertions.
- **E2E**: Playwright + `@axe-core/playwright`. Tag critical flows with `@critical`.
- **Stories**: Storybook with `autodocs` + `addon-a11y`.
- **Coverage**: 60% threshold (lines/functions/branches/statements). Lifted from rigid
  80% — we'd rather have tests that actually exercise the code than pad coverage.

## Hooks and CI

- **Pre-commit**: lint-staged autofix (Prettier + ESLint `--fix`). Warnings never
  block; only unfixable errors do. Bypass with `git commit --no-verify`.
- **CI lint and broad e2e**: advisory (`continue-on-error: true`). Reviewdog posts
  inline PR comments on new lint findings. Test failures show up in the workflow
  output and the coverage artifact.
- **CI gates that DO block**: type-check, build, unit tests, the a11y (axe) e2e
  gate, CodeQL.
- Dependency updates: Renovate (`.github/renovate.json`) auto-merges passing
  minor/patch PRs; major bumps and anything touching peer-dependency-sensitive
  packages (React, Next, the r3f stack) open as PRs for review — see that config for
  the exact grouping rules.

## Responsive philosophy

Mobile-first with breakpoint mixins, scaling down via `breakpoint-below($bp-NNN)`.
Touch detection via `@include touch`. Hover gated via `@include hover` (skips touch
devices). Reduced motion respected globally.

## Commits

Conventional commits encouraged in PR titles. Not locally enforced (no commitlint).
Never include `Co-Authored-By` trailers.

## For AI agents

Always check these before generating UI code:

- **Storybook Style Guide** chapters 02-07 (`packages/ui/src/docs/style-guide/`) — the
  rules.
- **`packages/ui/src/components/Button.tsx`** + `_button.scss` — the canonical hybrid
  Tailwind/SCSS example. **`packages/ui/src/components/ui/button.tsx`** — the shadcn
  scaffold pattern for interactive primitives.
- **`docs/ai-prompts.md`** — canned prompts for common tasks (add component, add form,
  add shadcn primitive, write tests).
- **`AGENTS.md`** — global rules (no `console.log`, no `any`, no magic numbers).

When the task is "add a button" or "add a form" or "add tests", paste the matching
section of `docs/ai-prompts.md` directly into your prompt — it's written to keep
generated code consistent with this template.
