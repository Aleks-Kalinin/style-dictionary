# Todos — Next.js + GraphQL + Sentry

A small CRUD app built to learn three things at once: a typed GraphQL server,
error monitoring with Sentry, and a hand-rolled design token system.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | — |
| GraphQL server | [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server) | Built on the Web `Request`/`Response` standard, so a Next.js route handler *is* its adapter. |
| Schema | [Pothos](https://pothos-graphql.dev) | Code-first. The schema is derived from TypeScript, so it cannot drift from the database. |
| Database | Prisma 7 + SQLite | Real persistence with no server to install. |
| GraphQL client | Apollo Client 4 | Normalised cache, good devtools. |
| Styling | CSS Modules + Style Dictionary tokens | No framework. Tokens authored as JSON, compiled to CSS and TS. |
| Monitoring | Sentry | Errors and tracing. See **[SENTRY.md](./SENTRY.md)**. |
| Component workshop | Storybook 10 + addon-a11y | Stories double as automated accessibility tests. |

## Getting started

```bash
npm install          # also runs `prisma generate`
npm run db:migrate   # creates dev.db and applies migrations
npm run db:seed      # inserts a few todos
npm run dev
```

Then open:

- <http://localhost:3000> — the app
- <http://localhost:3000/api/graphql> — GraphiQL, an interactive schema explorer
- <http://localhost:3000/sentry-demo> — one button per failure mode

Sentry is inert until you add a DSN. Everything else works without one.
**[SENTRY.md](./SENTRY.md)** explains how to get one and what each piece does.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Reset rows to the seed data |
| `npm run db:studio` | Prisma Studio, a GUI for the database |
| `npm run db:reset` | Drop and rebuild the database |
| `npm run schema:print` | Write the SDL to `schema.graphql` |
| `npm run tokens:build` | Compile `tokens/` into CSS + TS |
| `npm run storybook` | Storybook dev server on :6006 |
| `npm run build-storybook` | Static Storybook build |
| `npm run test:a11y` | Run all stories headlessly with axe, both themes |
| `npm run test:a11y:light` / `:dark` | Just one theme |

## Layout

```
tokens/                  Design tokens (DTCG JSON) - source of truth
prisma/
  schema.prisma          Database models. The source of truth for Pothos too.
  seed.ts
src/
  app/
    api/graphql/route.ts Yoga mounted as a route handler
    error.tsx            Route error boundary (reports to Sentry)
    global-error.tsx     Root layout error boundary
    sentry-demo/         The learning playground — safe to delete
  components/
    ui/                  Design system primitives + their *.stories.tsx
    todo/                Feature components
  graphql/
    builder.ts           Pothos schema builder
    schema.ts            Assembles the schema
    sentry-plugin.ts     Connects GraphQL execution to Sentry
    todo/                Types, queries, mutations
    debug/               Deliberate failures — safe to delete
  lib/
    prisma.ts            Prisma client singleton
    apollo.tsx           Apollo provider
  styles/
    tokens.css           GENERATED - do not edit
    tokens.ts            GENERATED - do not edit
    reset.css
    Tokens.stories.tsx   Living token reference, built from tokens.ts
  generated/             Prisma client + Pothos types (git-ignored)
```

## How the GraphQL side fits together

Three jobs that are easy to conflate:

- **Pothos** builds the schema. It reads types generated from `schema.prisma`,
  so renaming a column breaks the build rather than production.
- **Yoga** is the server: it takes an HTTP request, executes the query against
  that schema, and returns JSON.
- **Apollo Client** is the browser half: it sends operations, caches results
  normalised by `id`, and re-renders components when the cache changes.

To change the API:

1. Edit `prisma/schema.prisma`, then `npm run db:migrate`.
2. Add or edit fields in `src/graphql/todo/`.
3. `npm run schema:print` to see the SDL diff.

## The design system

No Tailwind. Tokens are authored as JSON in `tokens/` and compiled by
**Style Dictionary** into `src/styles/tokens.css` and `src/styles/tokens.ts`:

```bash
npm run tokens:build   # also runs automatically before `npm run build`
```

```
tokens/
  primitive/
    color.json        Neutral, brand and status ramps
    space.json        The 4px spacing scale
    typography.json   Sizes, weights, families, line heights
    shape.json        Radii and border widths
    motion.json       Durations and easing
    layout.json       Max width and z-index layers
  semantic/
    light.json        Roles: surfaces, text, borders, feedback, shadows
    dark.json         Only the roles that differ in dark mode
```

Tokens use the W3C [DTCG](https://tr.designtokens.org/) format (`$value` /
`$type`), so they are portable to other tooling rather than locked to this
project.

**`src/styles/tokens.css` and `src/styles/tokens.ts` are generated — do not
edit them.** Change the JSON and rebuild.

Two details worth knowing if you extend it:

- Semantic tokens keep their `var()` references in the output
  (`outputReferences`), which is what preserves the two tiers in the CSS.
  Change one primitive and everything referencing it follows.
- A token whose name is a prefix of another (`--color-accent-solid` and
  `--color-accent-solid-hover`) is authored under a `DEFAULT` key, because
  JSON cannot let a key be both a leaf and a group.

The same tokens still work in two tiers:

```
PRIMITIVES   --color-indigo-600, --space-4, --font-size-3
                       ↓ referenced by
SEMANTIC     --color-accent-base, --space-inset-md, --color-text-primary
                       ↓ the only thing components use
COMPONENTS   Button.module.css, Card.module.css, ...
```

The TypeScript output exists so code that needs to *enumerate* tokens reads
the real list instead of a hand-maintained copy. The Storybook **Tokens** page
is built from it — add a colour to `tokens/primitive/color.json`, rebuild, and
it appears in the docs with no further edits.

Components never name a literal colour. That constraint is what makes the dark
theme work: `tokens.css` reassigns the semantic layer under
`[data-theme="dark"]`, and every component follows with no changes. The toggle
in the header does nothing but set that attribute.

To rebrand, edit the primitives. To change what a role *means* — say, make the
accent colour green — edit the semantic layer. Components stay untouched either
way.

## Storybook and accessibility

```bash
npm run storybook        # dev server on :6006
npm run test:a11y        # run every story headlessly, in both themes
npm run build-storybook  # static build into storybook-static/
```

Stories live next to their components as `*.stories.tsx`. The **Tokens** entry
under *Design System* is a living reference that reads computed values out of
the DOM, so it cannot fall out of sync with `tokens.css`.

### How the a11y check works

`@storybook/addon-a11y` runs [axe-core](https://github.com/dequelabs/axe-core)
against each rendered story. Two things make it enforcement rather than
decoration:

1. `.storybook/preview.tsx` sets `a11y: { test: "error" }`. The alternative,
   `'todo'`, shows warnings in the UI but produces **no output at all in CI** —
   which looks like passing.
2. `@storybook/addon-vitest` runs the stories headlessly in Chromium, so
   `npm run test:a11y` fails the build on a violation.

`vitest.config.ts` defines **two projects, one per theme**. Colour contrast
depends entirely on which palette is active, so checking only the light theme
would miss half the problems.

This is not theoretical — setting it up caught four real contrast failures in
the dark palette. White text on `--color-accent-base` measured 4.46:1 against
the 4.5:1 minimum, and on `--color-danger-base` 3.76:1. The cause was a token
design flaw: one token was doing duty both as a *solid fill behind white text*
and as a *foreground colour on dark surfaces*, which need opposite lightness.
The fix was to split them — `--color-accent-solid` / `--color-danger-solid`
(backgrounds, with `--color-on-solid` as their foreground) are now separate
from `--color-accent-base` / `--color-danger-base` (borders, icons, text).

### Everything here is free

Storybook, the a11y addon and axe-core are all open source. **Chromatic** —
Storybook's paid hosted visual-testing service — is deliberately not installed,
and nothing in this setup sends data anywhere. The whole suite runs locally.

## Notes

- `dev.db` and `.env` are git-ignored. `.env.example` shows the shape.
- `src/generated/` is git-ignored and rebuilt by `prisma generate`, which runs
  automatically on `npm install`.
- SQLite has no enum type, so `Todo.priority` is stored as text and exposed as
  a real GraphQL enum — see `src/graphql/todo/types.ts`.
