# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Navigation map

**Always look up `backbone.yml` at the repo root before searching or exploring the codebase.** It maps every file to its role (entry points, routes, views, components, composables, services, types, config). Use it to jump straight to the right file instead of scanning directories. When you add, move, or remove files, update `backbone.yml` in the same change.

## What this is

A Vue 3 SPA ("Converter") with a home page and five converters: temperature (C/F/K), currency (live rates + history chart, backed by the public Frankfurter API), number bases (bin/oct/dec/hex), units (length/mass), and data size. No backend, no state library, no SSR. All conversion logic lives in composables; views are thin.

## Commands

```sh
npm run dev        # Vite dev server
npm run build      # vue-tsc --noEmit && vite build
npm run test       # Vitest, single run
npm run test:watch # Vitest watch mode
npm run lint       # oxlint src/
npm run format     # dprint fmt, formats in place (npm run format:check to verify)
npm run typecheck  # vue-tsc --noEmit
```

## Conventions

- Composition API only, `<script setup lang="ts">` in every component.
- State lives in composables (`src/composables/`), not Pinia or any store library. Don't add dependencies without a strong reason; the runtime deps are just `vue`, `vue-router`, and `@lucide/vue`.
- API calls go through `src/services/`, typed by interfaces in `src/types/`. Components never call `fetch` directly.
- Views are lazy-loaded in `src/router/index.ts`. For a new top-level converter, add its route there and an entry in `src/router/modules.ts` (the module registry drives both the NavBar links and the HomeView cards).
- Styling is Tailwind CSS v4 with theme tokens defined in `src/assets/main.css` (dark instrument design). Reuse existing tokens/utility classes (`panel`, `label-mono`, etc.) rather than inventing new ones.
- Imports use the `@/` alias for `src/`.
- Code style (enforced by dprint, `dprint.json`): semicolons always, single quotes, 2-space indent, width 120, Allman braces everywhere except arrow/anonymous function bodies which use K&R, and `else`/`catch`/`finally` on their own line.
- Tests are colocated `*.spec.ts` files (Vitest + @vue/test-utils, jsdom). New logic in composables or services needs a spec; mock `fetch` for API-backed code.
- Run `npm run test`, `npm run lint`, and `npm run typecheck` before considering a change done. CI (`.github/workflows/ci.yml`) runs these plus `npm run build` on every push and PR to `master`.

## Writing style

No em dashes in UI copy or docs (except quoted speech). Use periods, colons, commas, or slashes instead.
