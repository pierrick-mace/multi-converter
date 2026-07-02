import { computed, ref, watch } from 'vue'
import { fetchRates, fetchRatesOn } from '@/services/exchangeRates'
import type { Currency } from '@/types/currency'

/** Standard four-currency basket; `defaultBoardFor` drops the base from it. */
export const DEFAULT_BOARD_CODES = ['USD', 'GBP', 'CHF', 'JPY']

export interface BoardRow {
  code: string
  rate: number
  delta: number | null
  deltaPercent: number | null
}

/** Default basket for a given base currency: the standard four, minus the base itself. */
export function defaultBoardFor(base: string): string[] {
  return DEFAULT_BOARD_CODES.filter((code) => code !== base)
}

/** Calendar day before `dateStr` (YYYY-MM-DD), computed in UTC to dodge local-timezone drift. */
function dayBefore(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

/**
 * A basket of target currencies rated against a single base: one `latest`
 * request with multiple `symbols` plus one dated request (mirroring
 * `useCurrencyRates`' dayBefore pattern) for the previous-day delta.
 *
 * `baseCode` and `availableCurrencies` are read-only accessors, not refs, so
 * this stays reactive to state owned elsewhere (the shared "from" currency
 * and the loaded currency list) without taking ownership of it, the same
 * pattern `useRateHistory` uses for its base/target pair.
 */
export function useRateBoard(baseCode: () => string, availableCurrencies: () => Currency[]) {
  // `null` means "not customized": track the default basket for the current
  // base reactively rather than needing an imperative seed step once the
  // currency list finishes loading. Set to an explicit array once the user
  // (or a `?board=` URL param) customizes the basket.
  const customCodes = ref<string[] | null>(null)
  const rows = ref<BoardRow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let requestId = 0

  /**
   * Security: target codes can arrive from user-editable state (a URL query
   * param, or a direct assignment via `setTargetCodes`) rather than only
   * through `addTarget`, so every code is re-validated against the loaded
   * currency list right here, before it is ever interpolated into a request
   * URL. Unknown codes, duplicates, and the current base are dropped
   * silently instead of being sent to the API.
   */
  function validCodesFor(base: string, codes: string[]): string[] {
    const known = availableCurrencies()
    const seen = new Set<string>()
    const valid: string[] = []
    for (const code of codes) {
      if (code === base || seen.has(code)) continue
      if (!known.some((currency) => currency.code === code)) continue
      seen.add(code)
      valid.push(code)
    }
    return valid
  }

  // The effective, validated basket: derived, not stored, so it is always
  // correct for the *current* base and currency list the moment it is read,
  // with no risk of a stale value being observed (e.g. by the URL sync)
  // during the async window before the currency list has loaded.
  const targetCodes = computed<string[]>(() => {
    const base = baseCode()
    return validCodesFor(base, customCodes.value ?? defaultBoardFor(base))
  })

  function setTargetCodes(codes: string[]) {
    customCodes.value = codes
  }

  function addTarget(code: string) {
    const current = targetCodes.value
    if (code === baseCode() || current.includes(code)) return
    if (!availableCurrencies().some((currency) => currency.code === code)) return
    customCodes.value = [...current, code]
  }

  function removeTarget(code: string) {
    customCodes.value = targetCodes.value.filter((existing) => existing !== code)
  }

  async function loadBoard() {
    const base = baseCode()
    const symbols = targetCodes.value

    if (!base || symbols.length === 0) {
      rows.value = []
      error.value = null
      loading.value = false
      return
    }

    const id = ++requestId
    loading.value = true
    error.value = null
    try {
      const symbolsParam = symbols.join(',')
      const latest = await fetchRates(base, symbolsParam)
      if (id !== requestId) return

      let previousRates: Record<string, number> = {}
      try {
        const previous = await fetchRatesOn(dayBefore(latest.date), base, symbolsParam)
        if (id !== requestId) return
        previousRates = previous.rates
      } catch {
        // Same rationale as useCurrencyRates.loadPreviousRates: this only
        // feeds the delta indicator, so a failure here shouldn't take down
        // the whole board.
      }
      if (id !== requestId) return

      rows.value = symbols
        .filter((code) => typeof latest.rates[code] === 'number')
        .map((code) => {
          const rate = latest.rates[code]
          const previousRate = previousRates[code]
          const delta = typeof previousRate === 'number' ? rate - previousRate : null
          const deltaPercent = delta !== null && previousRate ? (delta / previousRate) * 100 : null
          return { code, rate, delta, deltaPercent }
        })
    } catch (err) {
      if (id !== requestId) return
      rows.value = []
      error.value = err instanceof Error ? err.message : 'Failed to load rate board'
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  watch([baseCode, targetCodes], loadBoard, { immediate: true })

  return {
    targetCodes,
    rows,
    loading,
    error,
    setTargetCodes,
    addTarget,
    removeTarget,
    loadBoard,
  }
}
