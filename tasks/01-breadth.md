# Phase 1: breadth, more conversion modules

Goal: prove that adding a converter is cheap by building a generic core, then shipping
three new modules on top of it. After this phase the app has six views and the marginal
cost of the seventh is an afternoon.

Agents to involve: frontend-developer (views/wiring), vue-expert (composable API
design for 1.1), test-automator (specs), ui-designer (layout consistency),
accessibility-tester (form labeling on the new views).

## 1.1 Generic linear-unit converter core

The architectural keystone of the phase. Length, mass, volume, speed, area, and data
size are all "multiply by a factor relative to a base unit". Build it once.

- New: `src/composables/useUnitConverter.ts`
  - Pure part: `convertUnit(value, from, to, factors)` where `factors` maps unit id to
    its ratio relative to a base unit. Framework-free, exported for direct testing.
  - Stateful part: `useUnitConverter(definition)` taking a module definition
    (`{ units: [{ id, label, symbol, factor }], defaultFrom, defaultTo }`) and exposing
    `value`, `from`, `to`, `result`, and a `swap()` helper. Derive `result` with
    `computed`, per the vue-expert pattern.
- New: `src/types/units.ts` for `UnitDefinition` and `UnitModule` interfaces.
- Spec: pure conversion math (round-trip A to B to A, identity, factor edge cases) and
  composable state (null input, swap, unit change recomputes).
- Not in scope: temperature refactor. C/F/K conversions are affine (offsets), not
  linear factors. Leave `useTemperatureConverter` as is; do not force it into this
  abstraction.

Depends on: nothing. Blocks: 1.2, 1.3.

## 1.2 Length and mass converter view

First consumer of the core, deliberately the simplest.

- New: `src/views/UnitsView.vue` with two panels (length, mass), each driven by
  `useUnitConverter` with its own factor table (m, km, cm, mm, mi, yd, ft, in; kg, g,
  mg, t, lb, oz).
- Factor tables live in a plain data module, e.g. `src/composables/unitModules.ts`, so
  they are testable and reusable.
- Route `/units`, NavBar link, lazy-loaded. Reuse the temperature view's layout
  rhythm: `label-mono` section labels, `field` inputs, `btn-tick` for swap and
  copy-to-clipboard (reuse `useClipboard`).
- Spec: factor-table sanity (1 mi = 1609.344 m, 1 lb = 453.59237 g) plus a light
  component test for conditional rendering if any.

Depends on: 1.1.

## 1.3 Data size converter view

Developer-facing module with one twist the generic core must prove it can absorb:
binary vs decimal prefixes.

- New: `src/views/DataSizeView.vue`, route `/data`, NavBar link.
- Two factor tables (decimal: kB/MB/GB/TB; binary: KiB/MiB/GiB/TiB; plus bits and
  bytes) or one combined table; decide during implementation, but keep it a factor
  table, not special-case code.
- Display formatting: large values need grouping and sensible precision. Use
  `Intl.NumberFormat`, no library.
- Spec: 1 GiB = 1073741824 bytes, 1 GB = 1000000000 bytes, bit/byte boundary.

Depends on: 1.1.

## 1.4 Number base converter view

Cheap, high-utility, and intentionally NOT built on `useUnitConverter`: base
conversion is parsing/formatting, not factor math. It validates that not everything
must fit the abstraction.

- New: `src/composables/useBaseConverter.ts` with pure functions
  (`parseInBase(text, base)`, `formatInBase(value, base)`) using `BigInt` so 64-bit
  hex values round-trip, plus a stateful composable syncing binary/octal/decimal/hex
  fields in the temperature-converter style (edit any field, others follow).
- New: `src/views/BasesView.vue`, route `/bases`, NavBar link. Monospace `field`
  inputs fit the instrument theme naturally.
- Validation: invalid digits for the active base set a visible error state, do not
  clear the other fields.
- Spec: round-trips across bases, invalid input handling, BigInt-range values.

Depends on: nothing (can run parallel to 1.2/1.3).

## 1.5 Home page module grid refresh

Six modules will not fit the current landing layout gracefully.

- Update `HomeView.vue` to a responsive grid of module cards (icon from `@lucide/vue`,
  name, one-line description), one card per route.
- Consider deriving the card list and the NavBar links from a single module registry
  (e.g. `src/router/modules.ts`) so adding a module updates both. Keep it a plain
  array, not a plugin system.
- ui-designer pass on the grid at mobile and `md:` breakpoints.

Depends on: 1.2, 1.3, 1.4 (do last, once the module set is real).
