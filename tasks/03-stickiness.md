# Phase 3: stickiness, persistence and resilience

Goal: a light touch of retention. The app remembers the user's last setup and degrades
gracefully when the network or the API is unavailable. Deliberately the smallest
phase: tasks 3.1 and 3.2 are in scope, 3.3 is a go/no-go decision, not a commitment.

Agents to involve: vue-expert (storage composable design), test-automator (storage and
cache specs), security-auditor (what gets persisted; nothing sensitive, but review),
performance-engineer and dependency-manager (3.3 PWA decision).

## 3.1 Local persistence of user setup

- New: `src/composables/useLocalStorage.ts`, a typed wrapper around
  `localStorage` (`useLocalStorage<T>(key, defaultValue)`) returning a ref that writes
  through on change. Guard JSON parse errors and storage unavailability (private
  browsing) by falling back to the default silently.
- Persist, per view: last currency pair and basket (complementing URL state from 2.1;
  URL wins when present, storage fills in when absent), last chart range, last unit
  selections in the Phase 1 modules.
- Namespace keys (`converter:currencies:pair`) to avoid collisions.
- Spec: read/write round-trip, corrupted JSON fallback, storage-unavailable fallback
  (mock `localStorage` throwing).

Depends on: Phase 2's 2.1 for the URL-wins precedence rule.

## 3.2 Rate caching and offline fallback

- Extend `src/services/exchangeRates.ts` with a thin cache layer: successful `latest`
  and history responses are stored (via 3.1's storage helper or directly) keyed by
  request signature, with the rate date kept alongside.
- On fetch failure, `useCurrencyRates` / `useRateHistory` fall back to the cached
  response when one exists and expose a `stale` flag with the cached rate date.
- UI: a clearly visible "rates as of {date}, offline" notice in `label-mono` when
  serving stale data; the existing error state remains for the no-cache case.
- Keep the cache at the service boundary so composable specs keep mocking the service
  module unchanged, per the architecture principles in the README.
- Spec: cache hit after failure, no-cache failure still errors, `stale` flag behavior,
  cache key correctness (different pairs do not collide).

Depends on: 3.1.

## 3.3 PWA install (decision gate, optional)

The one task in this plan that would add a dependency (`vite-plugin-pwa`, dev only).
Do not start it; decide it.

- Inputs to the decision: Phase 3.2 shipped (offline data story exists), bundle size
  review by performance-engineer, dependency review by dependency-manager
  (maintenance status, transitive surface), and actual desire to install the app.
- If go: manifest, icons, service worker via the plugin's defaults, cache-first for
  static assets only (API calls keep the 3.2 strategy, no SW-level API caching to
  avoid double-caching).
- If no-go: record the decision and rationale at the bottom of this file and stop.

Depends on: 3.2.

## Explicitly out of scope (for the record)

- Accounts, sync, or any backend: breaks the zero-backend, zero-secrets property.
- Keyed or paid APIs (crypto rates, geocoding): same reason.
- Pinia: nothing in this plan needs cross-view state beyond URL plus localStorage.
- A second visual theme or light mode: single-theme by design, per ui-designer.
