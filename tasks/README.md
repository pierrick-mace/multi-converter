# Converter roadmap

Product plan for growing the Converter SPA, sequenced breadth first, then depth, then a
bit of stickiness. Drafted with the business-analyst and architect-reviewer personas,
cross-checked against the project agents in `.claude/agents/` (frontend-developer,
vue-expert, test-automator, ui-designer, accessibility-tester, performance-engineer).

## Phases

| Phase | File                                 | Theme                      | Outcome                                               |
| ----- | ------------------------------------ | -------------------------- | ----------------------------------------------------- |
| 1     | [01-breadth.md](01-breadth.md)       | More conversion modules    | A generic unit-converter core powering 3 new views    |
| 2     | [02-depth.md](02-depth.md)           | Richer currency tooling    | The currency view becomes a destination, not a widget |
| 3     | [03-stickiness.md](03-stickiness.md) | Persistence and resilience | The app remembers you and survives a flaky network    |

Work phases in order. Within a phase, tasks are ordered by dependency: a task lists the
tasks it builds on. Every task is sized to land as one reviewable change (code, spec,
`backbone.yml` update, and NavBar/router wiring where relevant).

## Architecture principles (from the architect-reviewer pass)

These keep the codebase evolvable while it grows from 3 views to 6+:

1. **One pattern for pure logic.** Every converter follows the established split: pure,
   framework-free functions plus a thin stateful composable (see
   `useTemperatureConverter.ts`). Phase 1 generalizes this into `useUnitConverter` so new
   modules are data (a factor table), not code.
2. **Composables stay the unit of state.** No Pinia. If state must be shared across
   views or survive navigation, prefer the URL (query params) first, then a shared
   composable, per the vue-expert agent's guidance.
3. **Services own I/O.** All network access stays in `src/services/`, typed in
   `src/types/`. Phase 3 caching wraps the service layer, not the composables, so
   composables stay mock-friendly in tests.
4. **URL as state where it pays off.** Shareable/bookmarkable state (currency pair,
   amount, chart range) belongs in query params. This is Phase 2's backbone and also the
   cheapest "stickiness" there is.
5. **No new runtime dependencies** for Phases 1 and 2. The only candidate dependency in
   this plan is `vite-plugin-pwa` (dev dependency, Phase 3, optional task) and it needs a
   go/no-go decision at that point, not before.
6. **YAGNI guardrails.** No i18n framework, no chart library, no E2E framework, no
   second theme. The existing SVG chart, Vitest suite, and instrument theme cover the
   plan's needs.

## Definition of done (every task)

- `npm run test`, `npm run lint`, and `npm run typecheck` pass.
- New logic lives in a composable or service with a colocated `*.spec.ts`.
- New views are lazy-loaded in `src/router/index.ts` and linked from `NavBar.vue`.
- Styling reuses the instrument-design tokens (`panel`, `label-mono`, `field`,
  `btn-tick`) from `src/assets/main.css`. Note: the frontend-developer and ui-designer
  agent files still describe the retired glass theme; see task 0.1.
- `backbone.yml` updated in the same change.
- No em dashes in UI copy or docs.

## Phase 0: housekeeping (do before Phase 1)

- **0.1 Refresh stale agent docs.** `.claude/agents/frontend-developer.md` and
  `.claude/agents/ui-designer.md` still document the `.glass` / hero-photo theme that
  was replaced by the dark instrument design. Update both to describe the current tokens
  (`panel`, `label-mono`, `field`, `btn-tick`, `reveal`, grain/crosshair chrome) so
  agents stop steering new views toward a dead pattern.
