import { cacheKeyFor, readCache, withStaleFlag, writeCache } from '@/services/rateCache'
import type { ExchangeRatesResponse, RateHistoryResponse } from '@/types/currency'

const API_BASE = 'https://api.frankfurter.dev/v1'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * Security: guards against path traversal / request smuggling via a
 * date-shaped path segment. Only strings that look like YYYY-MM-DD are ever
 * concatenated into a URL path; everything else (e.g. `../latest`, or a
 * segment carrying its own query string) is rejected before it reaches
 * `fetch`. Every caller already produces dates in this shape, so this should
 * never trip in practice: it's defense in depth against a future caller
 * accidentally forwarding raw user input.
 */
function assertDateShape(value: string): string {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`Invalid date: expected YYYY-MM-DD, got "${value}"`)
  }
  return value
}

/**
 * Builds an API URL from a validated path segment plus query params.
 * `URLSearchParams` (via `URL#searchParams`) auto-encodes every param value,
 * so caller-supplied strings (base/symbols codes) can't break out of the
 * query string or inject extra params.
 */
function buildUrl(path: string, params: Record<string, string | undefined>): URL {
  const url = new URL(path, `${API_BASE}/`)
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value)
  }
  return url
}

/**
 * Shared fetch-then-cache-fallback flow for all three endpoints below.
 *
 * On success, the parsed response is written to the offline cache (keyed by
 * `url`) and returned as-is. On any failure -- a network error, a non-ok
 * status (raised as `notOkError`), or a malformed JSON body -- a cached
 * response for that exact `url` is served instead, flagged `stale: true`
 * with the `cachedAt` timestamp it was written with. With no cache entry for
 * that signature, the original error propagates unchanged: callers see
 * exactly the same failure they did before caching existed.
 */
async function fetchWithFallback<T extends object>(url: URL, notOkError: (status: number) => string): Promise<T> {
  const key = cacheKeyFor(url)
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(notOkError(response.status))
    }
    const data = (await response.json()) as T
    writeCache(key, data)
    return data
  } catch (err) {
    const cached = readCache<T>(key)
    if (cached) return withStaleFlag(cached)
    throw err
  }
}

export async function fetchRates(base?: string, symbols?: string): Promise<ExchangeRatesResponse> {
  const url = buildUrl('latest', { base, symbols })
  return fetchWithFallback<ExchangeRatesResponse>(url, (status) => `Failed to fetch exchange rates: ${status}`)
}

/**
 * Fetches rates as of a given date. Frankfurter resolves any non-trading day
 * (weekend, holiday) to the closest trading day at or before it, so callers
 * should read the resolved date back off the response rather than assume it
 * echoes the requested one.
 */
export async function fetchRatesOn(date: string, base: string, symbols?: string): Promise<ExchangeRatesResponse> {
  const url = buildUrl(assertDateShape(date), { base, symbols })
  return fetchWithFallback<ExchangeRatesResponse>(url, (status) => `Failed to fetch exchange rates: ${status}`)
}

export async function fetchRateHistory(base: string, symbol: string, startDate: string): Promise<RateHistoryResponse> {
  const url = buildUrl(`${assertDateShape(startDate)}..`, { base, symbols: symbol })
  return fetchWithFallback<RateHistoryResponse>(url, (status) => `Failed to fetch rate history: ${status}`)
}