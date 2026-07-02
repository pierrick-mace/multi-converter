import { fetchRateHistory } from '@/services/exchangeRates';
import type { RatePoint } from '@/types/currency';
import { ref, watch } from 'vue';

export const HISTORY_RANGES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
] as const;

export type HistoryRangeDays = (typeof HISTORY_RANGES)[number]['days'];

function startDateFor(days: number): string
{
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function useRateHistory(baseCode: () => string, targetCode: () => string)
{
  const points = ref<RatePoint[]>([]);
  const rangeDays = ref<HistoryRangeDays>(30);
  const loading = ref(false);
  const error = ref<string | null>(null);
  // True when `points` were served from the offline cache after a live
  // fetch failed (see `src/services/exchangeRates.ts`), rather than thrown
  // into `error`. Reset on every load attempt so a subsequent successful,
  // live fetch clears it again.
  const stale = ref(false);
  let requestId = 0;

  async function loadHistory()
  {
    const base = baseCode();
    const target = targetCode();
    // Frankfurter rejects base === symbol, and a flat 1:1 line carries no information
    if (!base || !target || base === target)
    {
      points.value = [];
      error.value = null;
      stale.value = false;
      loading.value = false;
      return;
    }

    const id = ++requestId;
    loading.value = true;
    error.value = null;
    try
    {
      const data = await fetchRateHistory(base, target, startDateFor(rangeDays.value));
      if (id !== requestId) return;
      stale.value = data.stale === true;
      points.value = Object.entries(data.rates)
        .map(([date, symbols]) => ({ date, rate: symbols[target] }))
        .filter((point): point is RatePoint => typeof point.rate === 'number')
        .sort((a, b) => a.date.localeCompare(b.date));
    }
    catch (err)
    {
      if (id !== requestId) return;
      points.value = [];
      error.value = err instanceof Error ? err.message : 'Failed to load rate history';
    }
    finally
    {
      if (id === requestId) loading.value = false;
    }
  }

  // `immediate: true` means this fires on mount, as soon as the composable is
  // constructed, not just on later base/target/range changes: a request-
  // triggering point future composables reusing this pattern should account
  // for in the app's mount-time fetch cascade.
  watch([baseCode, targetCode, rangeDays], loadHistory, { immediate: true });

  return { points, rangeDays, loading, error, stale, loadHistory };
}
