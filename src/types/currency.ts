export interface Currency
{
  code: string;
  rate: number;
}

/**
 * `stale`/`cachedAt` are only ever present on a response served from the
 * offline cache after a live fetch failed (see `src/services/rateCache.ts`);
 * a normal, successful response carries neither field. Optional rather than
 * a separate wrapper type so every existing call site that reads `.rates`/
 * `.date` keeps working unchanged, with callers that care about staleness
 * opting in via `data.stale`.
 */
export interface StaleMeta
{
  stale?: boolean;
  cachedAt?: string;
}

export interface ExchangeRatesResponse extends StaleMeta
{
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface RateHistoryResponse extends StaleMeta
{
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

export interface RatePoint
{
  date: string;
  rate: number;
}
