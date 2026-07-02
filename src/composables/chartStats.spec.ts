import { describe, expect, it } from 'vitest'
import { percentChange, seriesStats } from './chartStats'
import type { RatePoint } from '@/types/currency'

function points(rates: number[]): RatePoint[] {
  return rates.map((rate, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, rate }))
}

describe('seriesStats', () => {
  it('computes min, max, and average for a normal series', () => {
    expect(seriesStats(points([1.1, 1.3, 1.05, 1.2]))).toEqual({
      min: 1.05,
      max: 1.3,
      average: (1.1 + 1.3 + 1.05 + 1.2) / 4,
    })
  })

  it('returns the same value for min, max, and average with a single point', () => {
    expect(seriesStats(points([1.234]))).toEqual({ min: 1.234, max: 1.234, average: 1.234 })
  })

  it('returns the flat value for min, max, and average when the series is flat', () => {
    expect(seriesStats(points([1, 1, 1, 1]))).toEqual({ min: 1, max: 1, average: 1 })
  })

  it('returns null for an empty series', () => {
    expect(seriesStats([])).toBeNull()
  })

  it('handles negative rates correctly', () => {
    expect(seriesStats(points([-2, 4, 0, -6]))).toEqual({ min: -6, max: 4, average: -1 })
  })
})

describe('percentChange', () => {
  it('computes a positive percent change from first to last point', () => {
    expect(percentChange(points([1, 1.1]))).toBeCloseTo(10)
  })

  it('computes a negative percent change from first to last point', () => {
    expect(percentChange(points([1, 0.9]))).toBeCloseTo(-10)
  })

  it('ignores intermediate points, comparing only the first and last', () => {
    expect(percentChange(points([1, 5, -3, 1.5]))).toBeCloseTo(50)
  })

  it('returns zero for an unchanged range', () => {
    expect(percentChange(points([1.2, 1.2]))).toBe(0)
  })

  it('returns null for a single-point series', () => {
    expect(percentChange(points([1.2]))).toBeNull()
  })

  it('returns null for an empty series', () => {
    expect(percentChange([])).toBeNull()
  })

  it('returns null when the first value is zero, guarding against division by zero', () => {
    expect(percentChange(points([0, 1.5]))).toBeNull()
  })
})
