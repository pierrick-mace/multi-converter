import { computed, ref } from 'vue'
import { fetchRates, fetchRatesOn } from '@/services/exchangeRates'
import type { Currency, ExchangeRatesResponse } from '@/types/currency'

const BASE_CURRENCY: Currency = { code: 'EUR', rate: 1 }

/** Calendar day before `dateStr` (YYYY-MM-DD), computed in UTC to dodge local-timezone drift. */
function dayBefore(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export function useCurrencyRates() {
  const currencies = ref<Currency[]>([])
  const rates = ref<Currency[]>([])
  const previousRates = ref<Currency[]>([])
  const selectedCurrency = ref<Currency>(BASE_CURRENCY)
  const targetCurrency = ref<Currency>(BASE_CURRENCY)
  const amountToConvert = ref<number | null>(null)
  const rateDate = ref<string | null>(null)
  const previousRateDate = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  // True when `rates`/`rateDate` were served from the offline cache after a
  // live fetch failed (see `src/services/exchangeRates.ts`), rather than
  // thrown into `error`. Reset on every load attempt so a subsequent
  // successful, live fetch clears it again.
  const stale = ref(false)
  // Requested historical date (YYYY-MM-DD), null meaning "latest". Frankfurter
  // resolves non-trading days to the closest trading day at or before, so the
  // date actually shown to users is `rateDate` (the API-returned date), not
  // this one: they can legitimately differ.
  const conversionDate = ref<string | null>(null)

  const unitRate = computed(() => {
    const target = rates.value.find((rate) => rate.code === targetCurrency.value.code)
    return target?.rate ?? null
  })

  const inverseRate = computed(() => (unitRate.value !== null && unitRate.value !== 0 ? 1 / unitRate.value : null))

  const previousUnitRate = computed(() => {
    const target = previousRates.value.find((rate) => rate.code === targetCurrency.value.code)
    return target?.rate ?? null
  })

  const delta = computed(() => {
    if (unitRate.value === null || previousUnitRate.value === null) return null
    return unitRate.value - previousUnitRate.value
  })

  const deltaPercent = computed(() => {
    if (delta.value === null || previousUnitRate.value === null || previousUnitRate.value === 0) {
      return null
    }
    return (delta.value / previousUnitRate.value) * 100
  })

  const amountConverted = computed(() => {
    if (amountToConvert.value === null || unitRate.value === null) return 0
    return amountToConvert.value * unitRate.value
  })

  /** Populates `rateDate`/`rates` from an already-fetched response for the current `selectedCurrency`. */
  function applyRatesResponse(data: ExchangeRatesResponse) {
    rateDate.value = data.date
    stale.value = data.stale === true
    rates.value = [
      { code: selectedCurrency.value.code, rate: 1 },
      ...Object.entries(data.rates).map(([code, rate]) => ({ code, rate })),
    ]
  }

  async function loadCurrencies() {
    loading.value = true
    error.value = null
    try {
      const data = await fetchRates()
      currencies.value = [BASE_CURRENCY, ...Object.entries(data.rates).map(([code, rate]) => ({ code, rate }))].sort(
        (a, b) => a.code.localeCompare(b.code),
      )

      selectedCurrency.value = currencies.value.find((c) => c.code === 'EUR') ?? BASE_CURRENCY
      targetCurrency.value = currencies.value.find((c) => c.code === 'USD') ?? BASE_CURRENCY

      // Performance: `fetchRates()` above (no base) is already EUR-based
      // (Frankfurter's plain /latest defaults to EUR), and `selectedCurrency`
      // always resolves to EUR right after a fresh load, with `conversionDate`
      // still unset at this point (any `?date=` query param is re-applied
      // later, in `CurrenciesView`'s `readFromRoute`). So this response IS the
      // initial rates load: reuse it instead of firing the same request again
      // through `loadRatesForSelectedCurrency`.
      applyRatesResponse(data)
      await loadPreviousRates()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load currencies'
    } finally {
      loading.value = false
    }
  }

  async function loadRatesForSelectedCurrency() {
    try {
      const data = conversionDate.value
        ? await fetchRatesOn(conversionDate.value, selectedCurrency.value.code)
        : await fetchRates(selectedCurrency.value.code)
      applyRatesResponse(data)

      await loadPreviousRates()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load rates'
    }
  }

  // The previous trading day's rate feeds the up/down delta indicator only,
  // so a failure here is swallowed rather than surfaced through `error`:
  // it should never take down the main converter. `rateDate` already holds
  // the effective date (latest or historical), so this comparison-to-the-
  // day-before logic needs no historical-mode special case.
  async function loadPreviousRates() {
    if (!rateDate.value) return
    try {
      const data = await fetchRatesOn(dayBefore(rateDate.value), selectedCurrency.value.code)
      previousRateDate.value = data.date
      previousRates.value = [
        { code: selectedCurrency.value.code, rate: 1 },
        ...Object.entries(data.rates).map(([code, rate]) => ({ code, rate })),
      ]
    } catch {
      previousRateDate.value = null
      previousRates.value = []
    }
  }

  function swapCurrencies() {
    const previousFrom = selectedCurrency.value
    selectedCurrency.value = targetCurrency.value
    targetCurrency.value = previousFrom
    return loadRatesForSelectedCurrency()
  }

  return {
    currencies,
    selectedCurrency,
    targetCurrency,
    amountToConvert,
    amountConverted,
    unitRate,
    inverseRate,
    rateDate,
    previousRateDate,
    delta,
    deltaPercent,
    conversionDate,
    loading,
    error,
    stale,
    loadCurrencies,
    loadRatesForSelectedCurrency,
    swapCurrencies,
  }
}