import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fetchRateHistory, fetchRates, fetchRatesOn } from './exchangeRates'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response
}

describe('exchangeRates service', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ base: 'EUR', date: '2026-07-01', rates: {} }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function calledUrl(): string {
    return String(fetchMock.mock.calls[0][0])
  }

  describe('fetchRates', () => {
    it('builds the plain /latest URL with no query params when base/symbols are omitted', async () => {
      await fetchRates()
      expect(calledUrl()).toBe('https://api.frankfurter.dev/v1/latest')
    })

    it('builds /latest with base and symbols as auto-encoded query params', async () => {
      await fetchRates('EUR', 'USD,GBP')
      expect(calledUrl()).toBe('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD%2CGBP')
    })

    it('encodes a hostile symbols string instead of letting it inject extra query params', async () => {
      await fetchRates('EUR', 'USD&evil=1&base=XXX')
      const url = new URL(calledUrl())
      // Round-trips back to the exact original string...
      expect(url.searchParams.get('symbols')).toBe('USD&evil=1&base=XXX')
      // ...and there is still exactly one `base` param, holding the real
      // value: the hostile string never broke out of its own param value.
      expect(url.searchParams.getAll('base')).toEqual(['EUR'])
    })
  })

  describe('fetchRatesOn', () => {
    it('builds a dated URL with base and symbols as query params', async () => {
      await fetchRatesOn('2026-06-30', 'EUR', 'USD')
      expect(calledUrl()).toBe('https://api.frankfurter.dev/v1/2026-06-30?base=EUR&symbols=USD')
    })

    it('rejects a path-traversal-shaped date instead of building a request', async () => {
      await expect(fetchRatesOn('../latest', 'EUR')).rejects.toThrow(/invalid date/i)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('rejects a date that is not exactly YYYY-MM-DD', async () => {
      await expect(fetchRatesOn('2026-6-30', 'EUR')).rejects.toThrow(/invalid date/i)
      await expect(fetchRatesOn('not-a-date', 'EUR')).rejects.toThrow(/invalid date/i)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('fetchRateHistory', () => {
    it('builds an open-ended range URL from the start date', async () => {
      await fetchRateHistory('EUR', 'USD', '2026-01-01')
      expect(calledUrl()).toBe('https://api.frankfurter.dev/v1/2026-01-01..?base=EUR&symbols=USD')
    })

    it('rejects a path-traversal-shaped start date instead of building a request', async () => {
      await expect(fetchRateHistory('EUR', 'USD', '../../etc/passwd')).rejects.toThrow(
        /invalid date/i,
      )
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  it('throws a descriptive error when the response is not ok', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 500))
    await expect(fetchRates()).rejects.toThrow('Failed to fetch exchange rates: 500')
  })
})
