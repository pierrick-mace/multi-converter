import { fetchRateHistory } from '@/services/exchangeRates';
import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { useRateHistory } from './useRateHistory';

vi.mock('@/services/exchangeRates', () => ({
  fetchRateHistory: vi.fn(),
}));

const mockedFetchRateHistory = vi.mocked(fetchRateHistory);

describe('useRateHistory', () => {
  beforeEach(() => {
    mockedFetchRateHistory.mockReset();
  });

  it('loads history sorted by date for the given pair', async () => {
    mockedFetchRateHistory.mockResolvedValueOnce({
      base: 'EUR',
      start_date: '2026-06-01',
      end_date: '2026-06-03',
      rates: {
        '2026-06-03': { USD: 1.12 },
        '2026-06-01': { USD: 1.1 },
        '2026-06-02': { USD: 1.11 },
      },
    });

    const { points, loading } = useRateHistory(
      () => 'EUR',
      () => 'USD',
    );
    await flushPromises();

    expect(mockedFetchRateHistory).toHaveBeenCalledWith('EUR', 'USD', expect.any(String));
    expect(points.value).toEqual([
      { date: '2026-06-01', rate: 1.1 },
      { date: '2026-06-02', rate: 1.11 },
      { date: '2026-06-03', rate: 1.12 },
    ]);
    expect(loading.value).toBe(false);
  });

  it('skips the fetch and clears points when both currencies match', async () => {
    const { points, error } = useRateHistory(
      () => 'EUR',
      () => 'EUR',
    );
    await flushPromises();

    expect(mockedFetchRateHistory).not.toHaveBeenCalled();
    expect(points.value).toEqual([]);
    expect(error.value).toBeNull();
  });

  it('refetches when the pair changes', async () => {
    mockedFetchRateHistory.mockResolvedValue({
      base: 'EUR',
      start_date: '2026-06-01',
      end_date: '2026-06-01',
      rates: { '2026-06-01': { USD: 1.1 } },
    });

    const target = ref('USD');
    useRateHistory(
      () => 'EUR',
      () => target.value,
    );
    await flushPromises();
    expect(mockedFetchRateHistory).toHaveBeenCalledTimes(1);

    target.value = 'GBP';
    await nextTick();
    await flushPromises();

    expect(mockedFetchRateHistory).toHaveBeenCalledTimes(2);
    expect(mockedFetchRateHistory).toHaveBeenLastCalledWith('EUR', 'GBP', expect.any(String));
  });

  it('refetches with an earlier start date when the range widens', async () => {
    mockedFetchRateHistory.mockResolvedValue({
      base: 'EUR',
      start_date: '2026-06-01',
      end_date: '2026-06-01',
      rates: { '2026-06-01': { USD: 1.1 } },
    });

    const { rangeDays } = useRateHistory(
      () => 'EUR',
      () => 'USD',
    );
    await flushPromises();
    const firstStart = mockedFetchRateHistory.mock.calls[0][2];

    rangeDays.value = 365;
    await nextTick();
    await flushPromises();

    const secondStart = mockedFetchRateHistory.mock.calls[1][2];
    expect(secondStart < firstStart).toBe(true);
  });

  it('surfaces an error message when the history call fails', async () => {
    mockedFetchRateHistory.mockRejectedValueOnce(new Error('network down'));

    const { points, error, loading } = useRateHistory(
      () => 'EUR',
      () => 'USD',
    );
    await flushPromises();

    expect(error.value).toBe('network down');
    expect(points.value).toEqual([]);
    expect(loading.value).toBe(false);
  });

  describe('stale flag', () => {
    it('stays false for an ordinary, live response', async () => {
      mockedFetchRateHistory.mockResolvedValueOnce({
        base: 'EUR',
        start_date: '2026-06-01',
        end_date: '2026-06-01',
        rates: { '2026-06-01': { USD: 1.1 } },
      });

      const { stale } = useRateHistory(
        () => 'EUR',
        () => 'USD',
      );
      await flushPromises();

      expect(stale.value).toBe(false);
    });

    it('turns true when the service falls back to a cached, offline response', async () => {
      mockedFetchRateHistory.mockResolvedValueOnce({
        base: 'EUR',
        start_date: '2026-06-01',
        end_date: '2026-06-01',
        rates: { '2026-06-01': { USD: 1.1 } },
        stale: true,
        cachedAt: '2026-06-02T00:00:00.000Z',
      });

      const { stale, points } = useRateHistory(
        () => 'EUR',
        () => 'USD',
      );
      await flushPromises();

      expect(stale.value).toBe(true);
      expect(points.value).toEqual([{ date: '2026-06-01', rate: 1.1 }]);
    });
  });
});
