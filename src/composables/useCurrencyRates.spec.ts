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

  it('loads currencies with EUR as base and computes the converted amount, from a single fetch', async () => {
    mockedFetchRates.mockResolvedValueOnce({
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

    // Performance: the no-base /latest fetch above is already EUR-based, the
    // same request the initial rates load would otherwise repeat: it's
    // reused instead of firing a second, identical fetchRates call.
    expect(mockedFetchRates).toHaveBeenCalledTimes(1)
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

  it('crosses a month boundary correctly when computing the previous trading day', async () => {
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-03-01',
      rates: { USD: 1.1 },
    })
    mockedFetchRatesOn.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-02-28',
      rates: { USD: 1.08 },
    })

    const { targetCurrency, loadRatesForSelectedCurrency, previousRateDate } = useCurrencyRates()
    targetCurrency.value = { code: 'USD', rate: 1.1 }
    await loadRatesForSelectedCurrency()

    expect(mockedFetchRatesOn).toHaveBeenLastCalledWith('2026-02-28', 'EUR')
    expect(previousRateDate.value).toBe('2026-02-28')
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

  it('loads rates for a historical date and exposes the API-returned effective date', async () => {
    // 2023-04-29 was a Saturday; Frankfurter resolves it back to Friday.
    mockedFetchRatesOn
      .mockResolvedValueOnce({
        base: 'EUR',
        date: '2023-04-28',
        rates: { USD: 1.1 },
      })
      .mockResolvedValueOnce({
        base: 'EUR',
        date: '2023-04-27',
        rates: { USD: 1.09 },
      })

    const { conversionDate, targetCurrency, loadRatesForSelectedCurrency, rateDate, unitRate } =
      useCurrencyRates()
    targetCurrency.value = { code: 'USD', rate: 1.1 }
    conversionDate.value = '2023-04-29'
    await loadRatesForSelectedCurrency()

    expect(mockedFetchRates).not.toHaveBeenCalled()
    expect(mockedFetchRatesOn).toHaveBeenNthCalledWith(1, '2023-04-29', 'EUR')
    expect(rateDate.value).toBe('2023-04-28')
    expect(unitRate.value).toBeCloseTo(1.1)
  })

  it('compares a historical rate against the day before its effective (not requested) date', async () => {
    mockedFetchRatesOn
      .mockResolvedValueOnce({
        base: 'EUR',
        date: '2023-04-28',
        rates: { USD: 1.1 },
      })
      .mockResolvedValueOnce({
        base: 'EUR',
        date: '2023-04-27',
        rates: { USD: 1.09 },
      })

    const {
      conversionDate,
      targetCurrency,
      loadRatesForSelectedCurrency,
      previousRateDate,
      delta,
    } = useCurrencyRates()
    targetCurrency.value = { code: 'USD', rate: 1.1 }
    conversionDate.value = '2023-04-29'
    await loadRatesForSelectedCurrency()

    // dayBefore('2023-04-28'), not dayBefore('2023-04-29').
    expect(mockedFetchRatesOn).toHaveBeenNthCalledWith(2, '2023-04-27', 'EUR')
    expect(previousRateDate.value).toBe('2023-04-27')
    expect(delta.value).toBeCloseTo(0.01)
  })

  it('returns to fetching latest rates once conversionDate is cleared', async () => {
    mockedFetchRatesOn.mockResolvedValue({
      base: 'EUR',
      date: '2023-04-28',
      rates: { USD: 1.1 },
    })
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.2 },
    })

    const { conversionDate, targetCurrency, loadRatesForSelectedCurrency, rateDate } =
      useCurrencyRates()
    targetCurrency.value = { code: 'USD', rate: 1.1 }
    conversionDate.value = '2023-04-29'
    await loadRatesForSelectedCurrency()
    expect(rateDate.value).toBe('2023-04-28')

    conversionDate.value = null
    await loadRatesForSelectedCurrency()

    expect(mockedFetchRates).toHaveBeenCalledWith('EUR')
    expect(rateDate.value).toBe('2026-07-01')
  })

  it('swaps the base and target currencies and reloads rates for the new base', async () => {
    mockedFetchRates.mockResolvedValueOnce({
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

  describe('stale flag', () => {
    it('stays false for an ordinary, live response', async () => {
      mockedFetchRates.mockResolvedValueOnce({
        base: 'EUR',
        date: '2026-07-01',
        rates: { USD: 1.1 },
      })

      const { stale, loadCurrencies } = useCurrencyRates()
      await loadCurrencies()

      expect(stale.value).toBe(false)
    })

    it('turns true when the service falls back to a cached, offline response', async () => {
      mockedFetchRates.mockResolvedValueOnce({
        base: 'EUR',
        date: '2026-06-30',
        rates: { USD: 1.09 },
        stale: true,
        cachedAt: '2026-07-01T00:00:00.000Z',
      })

      const { stale, rateDate, loadCurrencies } = useCurrencyRates()
      await loadCurrencies()

      expect(stale.value).toBe(true)
      expect(rateDate.value).toBe('2026-06-30')
    })

    it('clears back to false once a subsequent load succeeds live', async () => {
      mockedFetchRates.mockResolvedValueOnce({
        base: 'EUR',
        date: '2026-06-30',
        rates: { USD: 1.09 },
        stale: true,
        cachedAt: '2026-07-01T00:00:00.000Z',
      })

      const { stale, targetCurrency, loadCurrencies, loadRatesForSelectedCurrency } =
        useCurrencyRates()
      await loadCurrencies()
      expect(stale.value).toBe(true)

      targetCurrency.value = { code: 'USD', rate: 1.1 }
      mockedFetchRates.mockResolvedValueOnce({
        base: 'EUR',
        date: '2026-07-01',
        rates: { USD: 1.1 },
      })
      await loadRatesForSelectedCurrency()

      expect(stale.value).toBe(false)
    })
  })
})
