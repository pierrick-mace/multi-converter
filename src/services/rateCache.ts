import type { StaleMeta } from '@/types/currency';

/**
 * Offline fallback cache for `src/services/exchangeRates.ts`, kept as a
 * sibling module rather than folded into `useLocalStorage.ts`: that
 * composable creates a `ref` plus a `watch`-based write-through, which needs
 * a reactivity scope. This cache is read/written from plain async functions
 * in a non-component module (no component instance, no effect scope to
 * attach a watcher to), so a direct, guarded `localStorage.getItem`/
 * `setItem` pair here is the simpler, correct tool: no ref indirection, no
 * risk of a stray watcher outliving anything, same silent-degradation
 * guarantee as `useLocalStorage`.
 *
 * Key format: `converter:cache:<url.pathname><url.search>`. The service
 * already builds a `URL` per request via `buildUrl`, and that URL is already
 * the exact request signature (endpoint path -- `latest`, a date, or a
 * `date..` range -- plus `base`/`symbols` as query params, in the fixed
 * order every call site supplies them). Reusing it as the cache key means
 * two requests collide only when they are genuinely identical, and never
 * collide when they differ in base, symbols, or date.
 */
const CACHE_PREFIX = 'converter:cache:';

export interface CacheEntry<T>
{
  data: T;
  cachedAt: string;
}

export function cacheKeyFor(url: URL): string
{
  return `${CACHE_PREFIX}${url.pathname}${url.search}`;
}

export function readCache<T>(key: string): CacheEntry<T> | null
{
  try
  {
    const raw = localStorage.getItem(key);
    if (raw === null)
    {
      return null;
    }
    return JSON.parse(raw) as CacheEntry<T>;
  }
  catch
  {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void
{
  try
  {
    const entry: CacheEntry<T> = { data, cachedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(entry));
  }
  catch
  {
    // Storage disabled (private browsing), blocked, or full: the live
    // response still reaches the caller, it just won't be there to fall
    // back on next time.
  }
}

/** Merges a cached payload back into the response shape, flagged as stale. */
export function withStaleFlag<T extends object>(entry: CacheEntry<T>): T & Required<StaleMeta>
{
  return { ...entry.data, stale: true, cachedAt: entry.cachedAt };
}
