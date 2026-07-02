import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { useRateBoard, defaultBoardFor, DEFAULT_BOARD_CODES } from './useRateBoard'
import { fetchRates, fetchRatesOn } from '@/services/exchangeRates'
import type { Currency } from '@/types/currency'

vi.mock('@/services/exchangeRates', () => ({
  fetchRates: vi.fn(),
  fetchRatesOn: vi.fn(),
}))

const mockedFetchRates = vi.mocked(fetchRates)
const mockedFetchRatesOn = vi.mocked(fetchRatesOn)

// Includes the whole standard default basket, so `useRateBoard` resolves a
// non-empty default the moment it's constructed with these as the known
// currency list.
const CURRENCIES: Currency[] = [
  { code: 'EUR', rate: 1 },
  { code: 'USD', rate: 1.1 },
  { code: 'GBP', rate: 0.9 },
  { code: 'CHF', rate: 0.95 },
  { code: 'JPY', rate: 160 },
]

// Deliberately excludes every code in the standard default basket, so the
// board starts from an empty basket: useful for tests about `addTarget` /
// `removeTarget` / `setTargetCodes` in isolation, without the automatic
// default-basket fetch getting in the way.
const NEUTRAL_CURRENCIES: Currency[] = [
  { code: 'EUR', rate: 1 },
  { code: 'AUD', rate: 1.6 },
  { code: 'CAD', rate: 1.5 },
]

describe('defaultBoardFor', () => {
  it('returns the standard basket minus the base currency', () => {
    expect(defaultBoardFor('EUR')).toEqual(DEFAULT_BOARD_CODES)
    expect(defaultBoardFor('USD')).toEqual(['GBP', 'CHF', 'JPY'])
  })
})

describe('useRateBoard', () => {
  beforeEach(() => {
    mockedFetchRates.mockReset()
    mockedFetchRatesOn.mockReset()
    mockedFetchRatesOn.mockResolvedValue({
      base: 'EUR',
      date: '2026-06-30',
      rates: { USD: 1.05, GBP: 0.89, CHF: 0.94, JPY: 158 },
    })
  })

  it('resolves the default basket automatically (no seed call needed) with one latest request and one dated request for deltas', async () => {
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.1, GBP: 0.9, CHF: 0.95, JPY: 160 },
    })

    const board = useRateBoard(
      () => 'EUR',
      () => CURRENCIES,
    )
    await flushPromises()

    expect(board.targetCodes.value).toEqual(defaultBoardFor('EUR'))
    expect(mockedFetchRates).toHaveBeenCalledTimes(1)
    expect(mockedFetchRates).toHaveBeenCalledWith('EUR', 'USD,GBP,CHF,JPY')
    expect(mockedFetchRatesOn).toHaveBeenCalledTimes(1)
    expect(mockedFetchRatesOn).toHaveBeenCalledWith('2026-06-30', 'EUR', 'USD,GBP,CHF,JPY')
    expect(board.rows.value.map((row) => row.code)).toEqual(['USD', 'GBP', 'CHF', 'JPY'])
    expect(board.loading.value).toBe(false)
    expect(board.error.value).toBeNull()
  })

  it('resolves the default basket reactively as the base and currency list change, with no imperative seed', async () => {
    mockedFetchRates.mockResolvedValue({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.1, GBP: 0.9, CHF: 0.95, JPY: 160 },
    })

    // The currency list starts empty, as it would during the async window
    // before `loadCurrencies` resolves in the real view.
    const knownCurrencies = ref<Currency[]>([])
    const board = useRateBoard(
      () => 'EUR',
      () => knownCurrencies.value,
    )
    await flushPromises()

    // Nothing is "known" yet, so the default basket validates down to
    // nothing: no wasted request, and no stale/incorrect basket observed by
    // anything reading `targetCodes` in this window (e.g. URL sync).
    expect(board.targetCodes.value).toEqual([])
    expect(mockedFetchRates).not.toHaveBeenCalled()

    knownCurrencies.value = CURRENCIES
    await nextTick()
    await flushPromises()

    // No `setTargetCodes` call was ever made: the default basket (minus the
    // base) resolved on its own once the currency list became available.
    expect(board.targetCodes.value).toEqual(defaultBoardFor('EUR'))
    expect(mockedFetchRates).toHaveBeenCalledWith('EUR', defaultBoardFor('EUR').join(','))
  })

  it('computes delta and deltaPercent against the previous trading day', async () => {
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.1, GBP: 0.9, CHF: 0.95, JPY: 160 },
    })

    const board = useRateBoard(
      () => 'EUR',
      () => CURRENCIES,
    )
    await flushPromises()

    const row = board.rows.value.find((entry) => entry.code === 'USD')!
    expect(row.delta).toBeCloseTo(0.05)
    expect(row.deltaPercent).toBeCloseTo((0.05 / 1.05) * 100)
  })

  it('reports a neutral (zero) delta when the rate is unchanged', async () => {
    mockedFetchRatesOn.mockReset()
    mockedFetchRatesOn.mockResolvedValue({
      base: 'EUR',
      date: '2026-06-30',
      rates: { USD: 1.05 },
    })
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.05 },
    })

    // USD is the only default-basket code known here, so it resolves as the
    // board's default automatically, no explicit setTargetCodes needed.
    const board = useRateBoard(
      () => 'EUR',
      () => NEUTRAL_CURRENCIES.concat({ code: 'USD', rate: 1.05 }),
    )
    await flushPromises()

    expect(board.targetCodes.value).toEqual(['USD'])
    expect(board.rows.value[0].delta).toBe(0)
    expect(board.rows.value[0].deltaPercent).toBe(0)
  })

  it('leaves delta as null when the previous-day fetch fails, without surfacing a top-level error', async () => {
    mockedFetchRatesOn.mockReset()
    mockedFetchRatesOn.mockRejectedValue(new Error('previous day unavailable'))
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.1, GBP: 0.9, CHF: 0.95, JPY: 160 },
    })

    const board = useRateBoard(
      () => 'EUR',
      () => CURRENCIES,
    )
    await flushPromises()

    expect(board.rows.value[0].delta).toBeNull()
    expect(board.rows.value[0].deltaPercent).toBeNull()
    expect(board.error.value).toBeNull()
  })

  it('surfaces an error message when the latest-rates fetch fails', async () => {
    mockedFetchRates.mockRejectedValueOnce(new Error('network down'))

    const board = useRateBoard(
      () => 'EUR',
      () => CURRENCIES,
    )
    await flushPromises()

    expect(board.error.value).toBe('network down')
    expect(board.rows.value).toEqual([])
    expect(board.loading.value).toBe(false)
  })

  it('drops unknown codes and the base itself before ever building a request URL', async () => {
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.1, GBP: 0.9, CHF: 0.95, JPY: 160 },
    })
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.1 },
    })

    const board = useRateBoard(
      () => 'EUR',
      () => CURRENCIES,
    )
    await flushPromises() // settle the automatic default-basket fetch first

    board.setTargetCodes(['USD', 'NOT-A-CODE', 'EUR', 'USD'])
    await flushPromises()

    expect(mockedFetchRates).toHaveBeenLastCalledWith('EUR', 'USD')
    expect(board.targetCodes.value).toEqual(['USD'])
    expect(board.rows.value.map((row) => row.code)).toEqual(['USD'])
  })

  it('does not issue a request when the basket is set to empty', async () => {
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.1, GBP: 0.9, CHF: 0.95, JPY: 160 },
    })

    const board = useRateBoard(
      () => 'EUR',
      () => CURRENCIES,
    )
    await flushPromises() // settle the automatic default-basket fetch first
    const callsAfterDefault = mockedFetchRates.mock.calls.length

    board.setTargetCodes([])
    await flushPromises()

    expect(mockedFetchRates).toHaveBeenCalledTimes(callsAfterDefault)
    expect(board.rows.value).toEqual([])
  })

  it('adds a target, ignoring duplicates and the current base', async () => {
    mockedFetchRates.mockResolvedValue({
      base: 'EUR',
      date: '2026-07-01',
      rates: { AUD: 1.6, CAD: 1.5 },
    })

    const board = useRateBoard(
      () => 'EUR',
      () => NEUTRAL_CURRENCIES,
    )
    await flushPromises()
    expect(board.targetCodes.value).toEqual([]) // NEUTRAL_CURRENCIES has no default matches

    board.addTarget('AUD')
    await flushPromises()
    expect(board.targetCodes.value).toEqual(['AUD'])

    board.addTarget('AUD') // duplicate
    board.addTarget('EUR') // current base
    board.addTarget('NOT-A-CODE') // unknown
    await flushPromises()
    expect(board.targetCodes.value).toEqual(['AUD'])

    board.addTarget('CAD')
    await flushPromises()
    expect(board.targetCodes.value).toEqual(['AUD', 'CAD'])
    expect(mockedFetchRates).toHaveBeenLastCalledWith('EUR', 'AUD,CAD')
  })

  it('removes a target', async () => {
    mockedFetchRates.mockResolvedValue({
      base: 'EUR',
      date: '2026-07-01',
      rates: { AUD: 1.6, CAD: 1.5 },
    })

    const board = useRateBoard(
      () => 'EUR',
      () => NEUTRAL_CURRENCIES,
    )
    board.setTargetCodes(['AUD', 'CAD'])
    await flushPromises()

    board.removeTarget('AUD')
    await flushPromises()

    expect(board.targetCodes.value).toEqual(['CAD'])
    expect(board.rows.value.map((row) => row.code)).toEqual(['CAD'])
  })

  it('drops a target once it becomes the base (e.g. after a currency swap)', async () => {
    mockedFetchRates.mockResolvedValue({
      base: 'EUR',
      date: '2026-07-01',
      rates: { AUD: 1.6, CAD: 1.5 },
    })

    const base = ref('EUR')
    const board = useRateBoard(
      () => base.value,
      () => NEUTRAL_CURRENCIES,
    )
    board.setTargetCodes(['AUD', 'CAD'])
    await flushPromises()
    expect(board.targetCodes.value).toEqual(['AUD', 'CAD'])

    mockedFetchRates.mockResolvedValueOnce({
      base: 'AUD',
      date: '2026-07-01',
      rates: { CAD: 0.94 },
    })
    base.value = 'AUD'
    await nextTick()
    await flushPromises()

    expect(board.targetCodes.value).toEqual(['CAD'])
    expect(mockedFetchRates).toHaveBeenLastCalledWith('AUD', 'CAD')
  })

  it('ignores a stale in-flight response when the basket is emptied before it resolves', async () => {
    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { USD: 1.1, GBP: 0.9, CHF: 0.95, JPY: 160 },
    })

    const board = useRateBoard(
      () => 'EUR',
      () => CURRENCIES,
    )
    await flushPromises() // settle the automatic default-basket fetch first

    let resolveFirst!: (value: {
      base: string
      date: string
      rates: Record<string, number>
    }) => void
    const first = new Promise((resolve) => {
      resolveFirst = resolve
    })
    mockedFetchRates.mockReturnValueOnce(first as ReturnType<typeof fetchRates>)

    board.setTargetCodes(['USD'])
    await flushPromises()
    expect(board.loading.value).toBe(true)

    board.setTargetCodes([])
    await flushPromises()
    expect(board.rows.value).toEqual([])

    // The now-stale first request resolves after the basket was emptied: it
    // must not repopulate `rows` (regression guard for requestId being
    // bumped on the empty-basket early return, not just the happy path).
    resolveFirst({ base: 'EUR', date: '2026-07-01', rates: { USD: 1.1 } })
    await flushPromises()

    expect(board.rows.value).toEqual([])
    expect(board.loading.value).toBe(false)
  })

  it('ignores a stale in-flight response when the basket changes again before it resolves', async () => {
    // NEUTRAL_CURRENCIES has no default-basket matches, so construction
    // itself issues no fetch: the queue below is consumed entirely by the
    // explicit setTargetCodes calls in this test.
    const board = useRateBoard(
      () => 'EUR',
      () => NEUTRAL_CURRENCIES,
    )
    await flushPromises()
    expect(mockedFetchRates).not.toHaveBeenCalled()

    let resolveFirst!: (value: {
      base: string
      date: string
      rates: Record<string, number>
    }) => void
    const first = new Promise((resolve) => {
      resolveFirst = resolve
    })
    mockedFetchRates.mockReturnValueOnce(first as ReturnType<typeof fetchRates>)

    board.setTargetCodes(['AUD'])
    await flushPromises()
    expect(board.loading.value).toBe(true)

    mockedFetchRates.mockResolvedValueOnce({
      base: 'EUR',
      date: '2026-07-01',
      rates: { CAD: 1.5 },
    })
    board.setTargetCodes(['CAD'])
    await flushPromises()

    // The stale first request now resolves, after the basket already moved on.
    resolveFirst({ base: 'EUR', date: '2026-07-01', rates: { AUD: 1.6 } })
    await flushPromises()

    expect(board.rows.value.map((row) => row.code)).toEqual(['CAD'])
    expect(board.loading.value).toBe(false)
  })

  describe('historical date mode', () => {
    it('fetches the requested historical date via fetchRatesOn (not latest) when a date getter is provided', async () => {
      mockedFetchRatesOn.mockReset()
      mockedFetchRatesOn.mockResolvedValue({
        base: 'EUR',
        date: '2023-04-28',
        rates: { USD: 1.09, GBP: 0.88, CHF: 0.94, JPY: 158 },
      })

      const board = useRateBoard(
        () => 'EUR',
        () => CURRENCIES,
        () => '2023-04-29',
      )
      await flushPromises()

      expect(mockedFetchRates).not.toHaveBeenCalled()
      // First fetchRatesOn call: the main dated fetch, for the requested date.
      expect(mockedFetchRatesOn).toHaveBeenNthCalledWith(1, '2023-04-29', 'EUR', 'USD,GBP,CHF,JPY')
      // Second call: the previous-day delta, based on the API-returned
      // *effective* date (2023-04-28), not the requested one.
      expect(mockedFetchRatesOn).toHaveBeenNthCalledWith(2, '2023-04-27', 'EUR', 'USD,GBP,CHF,JPY')
      expect(board.rows.value.map((row) => row.code)).toEqual(['USD', 'GBP', 'CHF', 'JPY'])
    })

    it('reacts to the date getter changing, switching from live to historical mode', async () => {
      const date = ref<string | null>(null)
      mockedFetchRates.mockResolvedValueOnce({
        base: 'EUR',
        date: '2026-07-01',
        rates: { USD: 1.1, GBP: 0.9, CHF: 0.95, JPY: 160 },
      })

      const board = useRateBoard(
        () => 'EUR',
        () => CURRENCIES,
        () => date.value,
      )
      await flushPromises()

      expect(mockedFetchRates).toHaveBeenCalledTimes(1)
      expect(board.rows.value.map((row) => row.code)).toEqual(['USD', 'GBP', 'CHF', 'JPY'])

      mockedFetchRatesOn.mockReset()
      mockedFetchRatesOn.mockResolvedValue({
        base: 'EUR',
        date: '2023-04-28',
        rates: { USD: 1.09, GBP: 0.88, CHF: 0.94, JPY: 158 },
      })
      date.value = '2023-04-29'
      await nextTick()
      await flushPromises()

      // Switching into historical mode re-fetches via fetchRatesOn, no
      // further fetchRates ("latest") calls: the board no longer shows live
      // rates once a historical date is active.
      expect(mockedFetchRates).toHaveBeenCalledTimes(1)
      expect(mockedFetchRatesOn).toHaveBeenNthCalledWith(1, '2023-04-29', 'EUR', 'USD,GBP,CHF,JPY')
    })
  })
})
