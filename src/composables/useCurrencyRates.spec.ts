import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useCurrencyRates } from './useCurrencyRates'
import { fetchRates, fetchRatesOn } from '@/services/exchangeRates'

vi.mock('@/services/exchangeRates', () => ({
  fetchRates: vi.fn(),
  fetchRatesOn: vi.fn(),
}))

const mockedFetchRates = vi.mocked(fetchRates)
const mockedFetchRatesOn = vi.mocked(fetchRatesOn)

describe('useCurrencyRates', () => {
  beforeEach(() => {
    mockedFetchRates.mockReset()
    mockedFetchRatesOn.mockReset()
    // Every test that reaches loadRatesForSelectedCurrency also triggers the
    // previous-day fetch; default it to something benign so tests that don't
    // care about the delta don't need to stub it explicitly.
    mockedFetchRatesOn.mockResolvedValue({
      base: 'EUR',
      date: '2026-06-30',
      rates: { USD: 1.1, GBP: 0.9 },
    })
  })

  it('loads currencies with EUR as base and computes the converted amount', async () => {
    mockedFetchRates
      .mockResolvedValueOnce({
        base: 'EUR',
        date: '2026-07-01',
        rates: { USD: 1.1, GBP: 0.9 },
      })
      .mockResolvedValueOnce({
        base: 'EUR',
        date: '2026-07-01',
        rates: { USD: 1.1, GBP: 0.9 },
      })

    const {
      currencies,
      selectedCurrency,
      targetCurrency,
      amountToConvert,
      amountConverted,
      unitRate,
      inverseRate,
      rateDate,
      loadCurrencies,
    } = useCurrencyRates()

    await loadCurrencies()

    expect(currencies.value.map((c) => c.code)).toEqual(['EUR', 'GBP', 'USD'])
    expect(selectedCurrency.value.code).toBe('EUR')
    expect(targetCurrency.value.code).toBe('USD')
    expect(rateDate.value).toBe('2026-07-01')
    expect(unitRate.value).toBeCloseTo(1.1)
    expect(inverseRate.value).toBeCloseTo(1 / 1.1)

    amountToConvert.value = 10
    expect(amountConverted.value).toBeCloseTo(11)
  })

  it('surfaces an error message when the API call fails', async () => {
    mockedFetchRates.mockRejectedValueOnce(new Error('network down'))

    const { error, loading, loadCurrencies } = useCurrencyRates()
    await loadCurrencies()

    expect(error.value).toBe('network down')
    expect(loading.value).toBe(false)
  })

  it('fetches the previous trading day one day before the latest rate date and exposes delta', async () => {
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.1, GBP: 0.9 },
    })
    mockedFetchRatesOn.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-06-30',
      rates: { USD: 1.05, GBP: 0.9 },
    })

    const {
      targetCurrency,
      loadRatesForSelectedCurrency,
      unitRate,
      delta,
      deltaPercent,
      previousRateDate,
    } = useCurrencyRates()
    targetCurrency.value = { code: 'USD', rate: 1.1 }
    await loadRatesForSelectedCurrency()

    expect(mockedFetchRatesOn).toHaveBeenLastCalledWith('2026-06-30', 'EUR')
    expect(previousRateDate.value).toBe('2026-06-30')
    expect(unitRate.value).toBeCloseTo(1.1)
    expect(delta.value).toBeCloseTo(0.05)
    expect(deltaPercent.value).toBeCloseTo((0.05 / 1.05) * 100)
  })

  it('reports a neutral (zero) delta when the rate is unchanged', async () => {
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.1 },
    })
    mockedFetchRatesOn.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-06-30',
      rates: { USD: 1.1 },
    })

    const { targetCurrency, loadRatesForSelectedCurrency, delta, deltaPercent } = useCurrencyRates()
    targetCurrency.value = { code: 'USD', rate: 1.1 }
    await loadRatesForSelectedCurrency()

    expect(delta.value).toBe(0)
    expect(deltaPercent.value).toBe(0)
  })

  it('leaves delta as null when the previous-day fetch fails, without surfacing a top-level error', async () => {
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.1 },
    })
    mockedFetchRatesOn.mockRejectedValueOnce(new Error('previous day unavailable'))

    const { targetCurrency, loadRatesForSelectedCurrency, delta, deltaPercent, error } =
      useCurrencyRates()
    targetCurrency.value = { code: 'USD', rate: 1.1 }
    await loadRatesForSelectedCurrency()

    expect(delta.value).toBeNull()
    expect(deltaPercent.value).toBeNull()
    expect(error.value).toBeNull()
  })

  it('swaps the base and target currencies and reloads rates for the new base', async () => {
    mockedFetchRates
      .mockResolvedValueOnce({
        base: 'EUR',
        date: '2026-07-01',
        rates: { USD: 1.1, GBP: 0.9 },
      })
      .mockResolvedValueOnce({
        base: 'EUR',
        date: '2026-07-01',
        rates: { USD: 1.1, GBP: 0.9 },
      })

    const { selectedCurrency, targetCurrency, loadCurrencies, swapCurrencies } = useCurrencyRates()
    await loadCurrencies()

    expect(selectedCurrency.value.code).toBe('EUR')
    expect(targetCurrency.value.code).toBe('USD')

    mockedFetchRates.mockResolvedValueOnce({
      base: 'USD',
      date: '2026-07-01',
      rates: { EUR: 0.91 },
    })

    await swapCurrencies()

    expect(selectedCurrency.value.code).toBe('USD')
    expect(targetCurrency.value.code).toBe('EUR')
    // The reload after a swap fetches rates for the new base.
    expect(mockedFetchRates).toHaveBeenLastCalledWith('USD')
  })
})
