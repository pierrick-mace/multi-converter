import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cacheKeyFor, readCache, withStaleFlag, writeCache } from './rateCache'

describe('rateCache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('cacheKeyFor', () => {
    it('derives the key from the URL path and query string', () => {
      const url = new URL('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD')
      expect(cacheKeyFor(url)).toBe('converter:cache:/v1/latest?base=EUR&symbols=USD')
    })

    it('gives different bases distinct keys', () => {
      const eur = cacheKeyFor(new URL('https://api.frankfurter.dev/v1/latest?base=EUR'))
      const usd = cacheKeyFor(new URL('https://api.frankfurter.dev/v1/latest?base=USD'))
      expect(eur).not.toBe(usd)
    })

    it('gives different symbols distinct keys', () => {
      const gbp = cacheKeyFor(new URL('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=GBP'))
      const usd = cacheKeyFor(new URL('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD'))
      expect(gbp).not.toBe(usd)
    })

    it('gives different dates (including latest vs. a dated path vs. a history range) distinct keys', () => {
      const latest = cacheKeyFor(new URL('https://api.frankfurter.dev/v1/latest?base=EUR'))
      const dated = cacheKeyFor(new URL('https://api.frankfurter.dev/v1/2026-06-30?base=EUR'))
      const history = cacheKeyFor(new URL('https://api.frankfurter.dev/v1/2026-06-30..?base=EUR'))
      expect(new Set([latest, dated, history]).size).toBe(3)
    })
  })

  describe('readCache / writeCache', () => {
    it('round-trips a written entry, with a cachedAt timestamp attached', () => {
      const key = 'converter:cache:/v1/latest?base=EUR'
      writeCache(key, { base: 'EUR', date: '2026-07-01', rates: { USD: 1.1 } })

      const entry = readCache<{ base: string; date: string; rates: Record<string, number> }>(key)
      expect(entry?.data).toEqual({ base: 'EUR', date: '2026-07-01', rates: { USD: 1.1 } })
      expect(typeof entry?.cachedAt).toBe('string')
    })

    it('returns null for a key that was never written', () => {
      expect(readCache('converter:cache:/v1/latest?base=NEVER')).toBeNull()
    })

    it('returns null instead of throwing on corrupted JSON', () => {
      const key = 'converter:cache:/v1/latest?base=CORRUPT'
      localStorage.setItem(key, '{not valid json')
      expect(readCache(key)).toBeNull()
    })

    describe('when storage is unavailable', () => {
      let getItemSpy: ReturnType<typeof vi.spyOn>
      let setItemSpy: ReturnType<typeof vi.spyOn>

      beforeEach(() => {
        getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('SecurityError: storage is disabled')
        })
        setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('SecurityError: storage is disabled')
        })
      })

      afterEach(() => {
        getItemSpy.mockRestore()
        setItemSpy.mockRestore()
      })

      it('never throws on read, falling back to null', () => {
        expect(() => readCache('converter:cache:/v1/latest?base=EUR')).not.toThrow()
        expect(readCache('converter:cache:/v1/latest?base=EUR')).toBeNull()
      })

      it('never throws on write', () => {
        expect(() =>
          writeCache('converter:cache:/v1/latest?base=EUR', { base: 'EUR' }),
        ).not.toThrow()
      })
    })
  })

  describe('withStaleFlag', () => {
    it('flags the cached payload as stale and carries its cachedAt timestamp', () => {
      const flagged = withStaleFlag({
        data: { base: 'EUR', date: '2026-06-30', rates: { USD: 1.09 } },
        cachedAt: '2026-07-01T00:00:00.000Z',
      })
      expect(flagged).toEqual({
        base: 'EUR',
        date: '2026-06-30',
        rates: { USD: 1.09 },
        stale: true,
        cachedAt: '2026-07-01T00:00:00.000Z',
      })
    })
  })
})
