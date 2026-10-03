@~/.claude/AGENTS.md

# uk-open-data-lab

Example site for `uk-open-data-connectors`: one microsite (the gauge index)
showing the full pipeline from a UK public-data connector to a deployed static
chart. See root `README.md` for the mission and package structure.

## Stack (this is the real one — verify against `package.json` before trusting any

doc that disagrees)

- npm workspaces + Turborepo, npm as the only package manager (never Bun/pnpm/yarn)
- Next.js 16 + React 19.2 + TypeScript (apps/web)
- Tailwind CSS 4 + SCSS hybrid + shadcn/ui (Base UI primitives) — see
  `packages/ui/components.json` and the Storybook Style Guide
- Vitest + Testing Library + jest-axe (unit/a11y), Playwright + `@axe-core/playwright`
  (e2e/a11y), Storybook
- `packages/stats-nz` is vendored from
  `github.com/olitreadwell/nz-open-data-connectors` — sync it with
  `node scripts/sync-connectors.mjs`, never edit it in place.

## Quality gates (enforced by husky + ESLint, see `packages/config-eslint/base.js`)

- `no-console` error (warn/error allowed) — no stray `console.log` in committed code
- `@typescript-eslint/no-explicit-any` error — no `any` escape hatches
- `no-magic-numbers` warn (small ints/array indexes/default values exempt)
- `@typescript-eslint/explicit-function-return-type` error — every exported function
  has an explicit return type
- pre-commit: `lint-staged` (Prettier + ESLint `--fix`); warnings never block, only
  unfixable errors do — bypass with `git commit --no-verify` when you must
- CI lint and the broad e2e suite are advisory (`continue-on-error: true`); **type-check,
  build, unit tests, the a11y (axe) e2e gate, and CodeQL block a PR**
- Coverage threshold is 60% (lines/functions/branches/statements) — see
  `CLAUDE.md` for why it's not 80%

## Conventions

- Components: prefer `@uk-open-data-lab/ui` first (`packages/ui/src/index.ts` is the export
  surface). Canonical pattern is `packages/ui/src/components/Button.tsx` +
  `_button.scss` — copy it for new hybrid Tailwind/SCSS components.
- New interactive primitive (dialog, dropdown, etc): `npx shadcn add <component>` run
  from `apps/web` (the only workspace the CLI's framework detection recognizes in this
  monorepo layout), then move the generated file into
  `packages/ui/src/components/ui/` and point its `cn` import at `@/lib/cn` — see the
  `button.tsx` already there for the pattern, and the comment at its top for why it
  coexists with the canonical `Button`.
- Design tokens: colors/spacing/radius live in `packages/ui/src/tokens/tokens.css`
  (single source of truth, including the shadcn color system) — don't hand-roll a
  second set of CSS variables elsewhere.
- Env vars: declared in `apps/web/src/env.ts`.
- Published microsites: gate what ships via `PUBLISHED_MICROSITES` in
  `apps/web/src/lib/published-microsites.ts`; microsite copy and config live in
  `apps/web/src/lib/microsites.ts`.

## Scope discipline

- Touch only what was asked
- Don't refactor adjacent code as a side effect
- Don't add features not in the spec
- Three similar lines is better than a premature abstraction
- Never fabricate a data source, a stat, or a "this worked" claim in an experiment

## Avoid

- `console.log` in committed code
- `any` / untyped escape hatches
- Fabricated data, stats, or experiment verdicts
- `git push --no-verify` or `git commit --no-verify` without a real reason
- Mixing package managers (npm only)

## When in doubt

- Stack questions → check the actual `package.json`, not this file's memory of it
- Component patterns → `packages/ui/src/components/`, Storybook Style Guide chapters
  02-07 (`packages/ui/src/docs/style-guide/`)
- Common task prompts (add component, add form, add Radix/shadcn primitive, write
  tests) → `docs/ai-prompts.md`
