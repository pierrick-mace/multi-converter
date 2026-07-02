import type { RatePoint } from '@/types/currency'

export interface SeriesStats {
  min: number
  max: number
  average: number
}

/**
 * Min/max/average across a series of rate points. Framework-free so it can be
 * unit-tested without mounting RateChart.vue.
 *
 * Returns null for an empty series (no meaningful stats to show). A
 * single-point series returns min = max = average = that point's rate.
 */
export function seriesStats(points: RatePoint[]): SeriesStats | null {
  if (points.length === 0) return null

  let min = Infinity
  let max = -Infinity
  let sum = 0
  for (const point of points) {
    if (point.rate < min) min = point.rate
    if (point.rate > max) max = point.rate
    sum += point.rate
  }

  return { min, max, average: sum / points.length }
}

/**
 * Percent change from the first to the last point in the visible range.
 *
 * Returns null when there is no meaningful change to report: fewer than two
 * points (nothing to compare), or a first value of zero (division by zero).
 */
export function percentChange(points: RatePoint[]): number | null {
  if (points.length < 2) return null

  const first = points[0].rate
  const last = points[points.length - 1].rate
  if (first === 0) return null

  return ((last - first) / first) * 100
}
