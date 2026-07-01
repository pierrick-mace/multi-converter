import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useCurrencyRates } from './useCurrencyRates'
import { fetchRates } from '@/services/exchangeRates'

vi.mock('@/services/exchangeRates', () => ({
  fetchRates: vi.fn(),
}))

const mockedFetchRates = vi.mocked(fetchRates)

describe('useCurrencyRates', () => {
  beforeEach(() => {
    mockedFetchRates.mockReset()
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
})
