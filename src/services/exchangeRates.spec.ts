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
    // Cache entries are namespaced (`converter:cache:...`), but every test
    // below still starts from a clean slate so a cache write from one test
    // can never be picked up as a fallback by a later, unrelated test that
    // happens to build the same request URL.
    localStorage.clear()
    fetchMock = vi.fn().mockResolvedValue(jsonResponse({ base: 'EUR', date: '2026-07-01', rates: {} }))
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
      await expect(fetchRateHistory('EUR', 'USD', '../../etc/passwd')).rejects.toThrow(/invalid date/i)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  it('throws a descriptive error when the response is not ok', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 500))
    await expect(fetchRates()).rejects.toThrow('Failed to fetch exchange rates: 500')
  })

  describe('offline fallback', () => {
    it('serves the cached payload, flagged stale, when a later fetch for the same signature fails', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ base: 'EUR', date: '2026-07-01', rates: { USD: 1.1 } }))
      await fetchRates('EUR', 'USD')

      fetchMock.mockRejectedValueOnce(new Error('network down'))
      const result = await fetchRates('EUR', 'USD')

      expect(result).toMatchObject({
        base: 'EUR',
        date: '2026-07-01',
        rates: { USD: 1.1 },
        stale: true,
      })
      expect(typeof result.cachedAt).toBe('string')
    })

    it('also falls back on a non-ok response, not just a network error', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ base: 'EUR', date: '2026-07-01', rates: { USD: 1.1 } }))
      await fetchRates('EUR', 'USD')

      fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 503))
      const result = await fetchRates('EUR', 'USD')

      expect(result).toMatchObject({ rates: { USD: 1.1 }, stale: true })
    })

    it('propagates the original error, unchanged, when there is no cache entry to fall back on', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'))
      await expect(fetchRates('EUR', 'USD')).rejects.toThrow('network down')
    })

    it('does not let a different base or symbols pair serve a mismatched cache entry', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ base: 'EUR', date: '2026-07-01', rates: { USD: 1.1 } }))
      await fetchRates('EUR', 'USD')

      fetchMock.mockRejectedValueOnce(new Error('network down'))
      await expect(fetchRates('EUR', 'GBP')).rejects.toThrow('network down')
    })

    it('does not let a different date serve a mismatched cache entry', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ base: 'EUR', date: '2026-06-30', rates: { USD: 1.09 } }))
      await fetchRatesOn('2026-06-30', 'EUR')

      fetchMock.mockRejectedValueOnce(new Error('network down'))
      await expect(fetchRatesOn('2026-06-29', 'EUR')).rejects.toThrow('network down')
    })

    it('falls back for fetchRateHistory the same way', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          base: 'EUR',
          start_date: '2026-06-01',
          end_date: '2026-07-01',
          rates: { '2026-07-01': { USD: 1.1 } },
        }),
      )
      await fetchRateHistory('EUR', 'USD', '2026-06-01')

      fetchMock.mockRejectedValueOnce(new Error('network down'))
      const result = await fetchRateHistory('EUR', 'USD', '2026-06-01')

      expect(result).toMatchObject({ rates: { '2026-07-01': { USD: 1.1 } }, stale: true })
    })

    it('keeps working, without throwing, when storage is unavailable (private browsing)', async () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: storage is disabled')
      })
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('SecurityError: storage is disabled')
      })

      try {
        fetchMock.mockResolvedValueOnce(jsonResponse({ base: 'EUR', date: '2026-07-01', rates: { USD: 1.1 } }))
        await expect(fetchRates('EUR', 'USD')).resolves.toMatchObject({ rates: { USD: 1.1 } })

        fetchMock.mockRejectedValueOnce(new Error('network down'))
        await expect(fetchRates('EUR', 'USD')).rejects.toThrow('network down')
      } finally {
        getItemSpy.mockRestore()
        setItemSpy.mockRestore()
      }
    })
  })
})