import { computed, ref } from 'vue'
import { fetchRates } from '@/services/exchangeRates'
import type { Currency } from '@/types/currency'

const BASE_CURRENCY: Currency = { code: 'EUR', rate: 1 }

export function useCurrencyRates() {
  const currencies = ref<Currency[]>([])
  const rates = ref<Currency[]>([])
  const selectedCurrency = ref<Currency>(BASE_CURRENCY)
  const targetCurrency = ref<Currency>(BASE_CURRENCY)
  const amountToConvert = ref<number | null>(null)
  const rateDate = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const unitRate = computed(() => {
    const target = rates.value.find((rate) => rate.code === targetCurrency.value.code)
    return target?.rate ?? null
  })

  const inverseRate = computed(() =>
    unitRate.value !== null && unitRate.value !== 0 ? 1 / unitRate.value : null,
  )

  const amountConverted = computed(() => {
    if (amountToConvert.value === null || unitRate.value === null) return 0
    return amountToConvert.value * unitRate.value
  })

  async function loadCurrencies() {
    loading.value = true
    error.value = null
    try {
      const data = await fetchRates()
      currencies.value = [
        BASE_CURRENCY,
        ...Object.entries(data.rates).map(([code, rate]) => ({ code, rate })),
      ].sort((a, b) => a.code.localeCompare(b.code))

      selectedCurrency.value = currencies.value.find((c) => c.code === 'EUR') ?? BASE_CURRENCY
      targetCurrency.value = currencies.value.find((c) => c.code === 'USD') ?? BASE_CURRENCY

      await loadRatesForSelectedCurrency()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load currencies'
    } finally {
      loading.value = false
    }
  }

  async function loadRatesForSelectedCurrency() {
    try {
      const data = await fetchRates(selectedCurrency.value.code)
      rateDate.value = data.date
      rates.value = [
        { code: selectedCurrency.value.code, rate: 1 },
        ...Object.entries(data.rates).map(([code, rate]) => ({ code, rate })),
      ]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load rates'
    }
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
    loading,
    error,
    loadCurrencies,
    loadRatesForSelectedCurrency,
  }
}
