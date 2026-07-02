import type { UnitModule } from '@/types/units';
import { describe, expect, it } from 'vitest';
import { convertUnit, useUnitConverter } from './useUnitConverter';

const lengthFactors = {
  m: 1,
  km: 1000,
  cm: 0.01,
  mm: 0.001,
};

const lengthModule: UnitModule = {
  units: [
    { id: 'm', label: 'Meter', symbol: 'm', factor: 1 },
    { id: 'km', label: 'Kilometer', symbol: 'km', factor: 1000 },
    { id: 'cm', label: 'Centimeter', symbol: 'cm', factor: 0.01 },
    { id: 'mm', label: 'Millimeter', symbol: 'mm', factor: 0.001 },
  ],
  defaultFrom: 'm',
  defaultTo: 'km',
};

describe('convertUnit', () => {
  it('converts between two units via the base unit', () => {
    expect(convertUnit(1, 'km', 'm', lengthFactors)).toBe(1000);
    expect(convertUnit(100, 'cm', 'm', lengthFactors)).toBe(1);
  });

  it('round-trips A to B to A', () => {
    const original = 42;
    const toKm = convertUnit(original, 'm', 'km', lengthFactors);
    const backToM = convertUnit(toKm, 'km', 'm', lengthFactors);
    expect(backToM).toBeCloseTo(original);
  });

  it('returns the same value for an identity conversion', () => {
    expect(convertUnit(7, 'm', 'm', lengthFactors)).toBe(7);
  });

  it('handles a zero value', () => {
    expect(convertUnit(0, 'km', 'mm', lengthFactors)).toBe(0);
  });

  it('handles factors smaller than 1', () => {
    expect(convertUnit(1, 'm', 'mm', lengthFactors)).toBeCloseTo(1000);
    expect(convertUnit(1, 'mm', 'm', lengthFactors)).toBeCloseTo(0.001);
  });

  it('throws for an unknown source unit id', () => {
    expect(() => convertUnit(1, 'unknown', 'm', lengthFactors)).toThrow();
  });

  it('throws for an unknown target unit id', () => {
    expect(() => convertUnit(1, 'm', 'unknown', lengthFactors)).toThrow();
  });
});

describe('useUnitConverter', () => {
  it('initializes from and to with the module defaults', () => {
    const { from, to } = useUnitConverter(lengthModule);
    expect(from.value).toBe('m');
    expect(to.value).toBe('km');
  });

  it('returns null result when value is null', () => {
    const { result } = useUnitConverter(lengthModule);
    expect(result.value).toBeNull();
  });

  it('computes result reactively from value', () => {
    const { value, result } = useUnitConverter(lengthModule);
    value.value = 1500;
    expect(result.value).toBeCloseTo(1.5);
  });

  it('recomputes result when the unit changes', () => {
    const { value, to, result } = useUnitConverter(lengthModule);
    value.value = 1;
    expect(result.value).toBeCloseTo(0.001);
    to.value = 'cm';
    expect(result.value).toBeCloseTo(100);
  });

  it('swaps from and to', () => {
    const { from, to, swap } = useUnitConverter(lengthModule);
    swap();
    expect(from.value).toBe('km');
    expect(to.value).toBe('m');
  });

  it('recomputes result after swap', () => {
    const { value, from, to, result, swap } = useUnitConverter(lengthModule);
    value.value = 1;
    expect(from.value).toBe('m');
    expect(to.value).toBe('km');
    expect(result.value).toBeCloseTo(0.001);

    swap();
    expect(result.value).toBeCloseTo(1000);
  });
});
