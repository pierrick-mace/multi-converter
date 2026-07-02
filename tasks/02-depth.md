# Phase 2: depth, richer currency tooling

Goal: turn the currency view from a widget into a destination. Everything here builds
on the existing `useCurrencyRates` / `useRateHistory` / `RateChart` stack and the
Frankfurter API's free capabilities (latest, dated, and range queries). No new
dependencies.

Agents to involve: frontend-developer, vue-expert (URL-state composable in 2.1),
test-automator (mocked-fetch specs), ui-designer (chart annotations, panel layout),
security-auditor (2.4 touches how API URLs are built from user input),
performance-engineer (2.5 adds a second history series; watch request volume).

## 2.1 Shareable URL state

The backbone task of the phase: pair, amount, and chart range live in the URL, so any
conversion is bookmarkable and sendable.

- New: `src/composables/useQuerySync.ts`, a small composable that syncs a set of refs
  with route query params (read on setup, `router.replace` on change, guard against
  loops). Per the vue-expert guidance, this is the URL-first alternative to a store.
- Wire into `CurrenciesView.vue`: `?from=EUR&to=USD&amount=100&range=3M`.
- Validate params against the loaded currency list; fall back to defaults silently on
  garbage input.
- Spec: ref-to-query and query-to-ref sync, invalid param fallback. Use the in-memory
  router pattern from `NavBar.spec.ts`.

Depends on: nothing. Blocks: 2.2 (swap should update the URL), 2.3, 2.6.

## 2.2 Swap button and rate delta indicator

Two small, immediately felt wins in one change.

- Swap: a `btn-tick` button between the two currency selects that swaps base/target
  (and updates the URL via 2.1).
- Delta: extend `useCurrencyRates` to also fetch the previous trading day's rate and
  expose `delta` and `deltaPercent` computed values. Render as a small up/down
  indicator next to the unit rate, `text-accent` for up, `text-danger` for down,
  with the comparison date labeled.
- Spec: delta math (including zero/unchanged), previous-day fetch mocked at the
  service boundary, swap behavior.

Depends on: 2.1 (soft; can land before it, then get URL-wired).

## 2.3 Historical date conversion

"What was 100 USD in EUR on 2023-05-01."

- Extend `src/services/exchangeRates.ts` with `fetchRatesAt(date, base)` hitting
  Frankfurter's `/v1/{date}` endpoint; add types in `src/types/currency.ts`.
- UI: a date input (explicitly dark-styled per the ui-designer checklist; native date
  pickers default to light chrome) that switches the conversion panel to that date's
  rates, with a clear "rates as of {date}" label and a one-click return to latest.
- Guard rails: Frankfurter data starts 1999-01-04 and skips non-trading days (the API
  returns the closest previous trading day; surface the returned date, not the
  requested one).
- Spec: service URL construction, composable behavior for historical mode, non-trading
  day date display.

Depends on: 2.1 (date belongs in the URL too).

## 2.4 Multi-target rate board

One base against a small basket of targets at once.

- Extend `useCurrencyRates` (or add `useRateBoard.ts`) to fetch one `latest` call with
  multiple symbols (`?symbols=USD,GBP,JPY`) and expose a list of per-target rates.
- UI: a `panel` below the converter listing basket rows (flag-free, text plus rate
  plus delta once 2.2 exists). Add/remove targets via the existing dark-styled select
  pattern. Default basket: USD, GBP, CHF, JPY.
- Basket composition is a candidate for persistence in Phase 3 (task 3.1); until then
  it can live in the URL (`?board=USD,GBP`).
- Security note: target symbols are user input that ends up in a request URL; validate
  against the fetched currency list before building the query string.
- Spec: single-request fetch with multiple symbols, add/remove behavior, validation.

Depends on: 2.1, 2.2.

## 2.5 Chart upgrades

Make `RateChart.vue` earn its place.

- Min/max/average reference lines with `label-mono` annotations.
- Range endpoints comparison: percent change over the visible range in the chart
  header.
- Optional stretch: a second series to compare two targets against the same base
  (dashed line, `ink-dim`). Requires a second `useRateHistory` instance; watch
  request count and reuse the stale-request guard.
- Spec: min/max/average computation as pure functions (extract them from the
  component if they are not already), percent-change math.

Depends on: 2.1 (range in URL). The stretch item depends on 2.4's target handling.

## 2.6 Copy and share affordances

- Reuse `useClipboard` on the currency view: copy the converted amount, and copy a
  share link (current URL) via a dedicated button.
- Format copied amounts with `Intl.NumberFormat` using the target currency code.
- Spec: formatting only; clipboard is already covered.

Depends on: 2.1.
