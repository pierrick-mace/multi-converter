import { describe, expect, it } from 'vitest';
import { formatInBase, parseInBase, useBaseConverter } from './useBaseConverter';

describe('parseInBase / formatInBase', () => {
  it('round-trips small values across bases', () => {
    for (const base of [2, 8, 10, 16] as const)
    {
      const text = formatInBase(42n, base);
      expect(parseInBase(text, base)).toBe(42n);
    }
  });

  it('parses each base correctly', () => {
    expect(parseInBase('101010', 2)).toBe(42n);
    expect(parseInBase('52', 8)).toBe(42n);
    expect(parseInBase('42', 10)).toBe(42n);
    expect(parseInBase('2a', 16)).toBe(42n);
    expect(parseInBase('2A', 16)).toBe(42n);
  });

  it('formats each base correctly, with uppercase hex letters', () => {
    expect(formatInBase(42n, 2)).toBe('101010');
    expect(formatInBase(42n, 8)).toBe('52');
    expect(formatInBase(42n, 10)).toBe('42');
    expect(formatInBase(42n, 16)).toBe('2A');
  });

  it('formats zero as "0" in every base', () => {
    for (const base of [2, 8, 10, 16] as const)
    {
      expect(formatInBase(0n, base)).toBe('0');
    }
  });

  it('round-trips a 64-bit hex value through every base', () => {
    const value = parseInBase('FFFFFFFFFFFFFFFF', 16);
    expect(value).toBe(18446744073709551615n);

    for (const base of [2, 8, 10, 16] as const)
    {
      const text = formatInBase(value, base);
      expect(parseInBase(text, base)).toBe(value);
    }
  });

  it('throws on empty input', () => {
    expect(() => parseInBase('', 10)).toThrow();
    expect(() => parseInBase('   ', 2)).toThrow();
  });

  it('throws on a digit invalid for the given base', () => {
    expect(() => parseInBase('2', 2)).toThrow();
    expect(() => parseInBase('8', 8)).toThrow();
    expect(() => parseInBase('g', 16)).toThrow();
    expect(() => parseInBase('-5', 10)).toThrow();
  });

  it('throws when formatting a negative value', () => {
    expect(() => formatInBase(-1n, 10)).toThrow();
  });
});

describe('useBaseConverter', () => {
  it('updates octal, decimal, and hex from binary', () => {
    const { binary, octal, decimal, hex, updateFromBinary } = useBaseConverter();
    binary.value = '101010';
    updateFromBinary();
    expect(octal.value).toBe('52');
    expect(decimal.value).toBe('42');
    expect(hex.value).toBe('2A');
  });

  it('updates binary, octal, and hex from decimal', () => {
    const { binary, octal, decimal, hex, updateFromDecimal } = useBaseConverter();
    decimal.value = '255';
    updateFromDecimal();
    expect(binary.value).toBe('11111111');
    expect(octal.value).toBe('377');
    expect(hex.value).toBe('FF');
  });

  it('updates binary, octal, and decimal from hex', () => {
    const { binary, octal, decimal, hex, updateFromHex } = useBaseConverter();
    hex.value = 'ff';
    updateFromHex();
    expect(binary.value).toBe('11111111');
    expect(octal.value).toBe('377');
    expect(decimal.value).toBe('255');
  });

  it('round-trips a 64-bit hex value through all four fields', () => {
    const { binary, octal, decimal, hex, updateFromHex } = useBaseConverter();
    hex.value = 'FFFFFFFFFFFFFFFF';
    updateFromHex();
    expect(decimal.value).toBe('18446744073709551615');

    const roundTrip = useBaseConverter();
    roundTrip.decimal.value = decimal.value;
    roundTrip.updateFromDecimal();
    expect(roundTrip.binary.value).toBe(binary.value);
    expect(roundTrip.octal.value).toBe(octal.value);
    expect(roundTrip.hex.value).toBe('FFFFFFFFFFFFFFFF');
  });

  it('does nothing when the source field is cleared', () => {
    const { decimal, hex, updateFromDecimal } = useBaseConverter();
    decimal.value = '';
    updateFromDecimal();
    expect(hex.value).toBe('');
  });

  it('sets a field-scoped error on invalid input and leaves other fields untouched', () => {
    const { binary, octal, decimal, hex, error, updateFromDecimal, updateFromBinary } = useBaseConverter();

    decimal.value = '255';
    updateFromDecimal();
    expect(binary.value).toBe('11111111');
    expect(octal.value).toBe('377');
    expect(hex.value).toBe('FF');

    binary.value = '1012';
    updateFromBinary();

    expect(error.value).not.toBeNull();
    expect(error.value?.base).toBe(2);
    // Other fields keep their last valid values; only the invalid field changed.
    expect(octal.value).toBe('377');
    expect(decimal.value).toBe('255');
    expect(hex.value).toBe('FF');
  });

  it('clears the error once the active field becomes valid again', () => {
    const { binary, error, updateFromBinary } = useBaseConverter();
    binary.value = '102';
    updateFromBinary();
    expect(error.value).not.toBeNull();

    binary.value = '101';
    updateFromBinary();
    expect(error.value).toBeNull();
  });
});
