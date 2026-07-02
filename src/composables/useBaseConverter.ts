import { ref, type Ref } from 'vue'

export type Base = 2 | 8 | 10 | 16

export const BASES: readonly Base[] = [2, 8, 10, 16]

const DIGITS = '0123456789ABCDEF'

function digitValue(char: string): number {
  return DIGITS.indexOf(char.toUpperCase())
}

/**
 * Parses text as an unsigned integer in the given base, returning a BigInt so
 * values across the full 64-bit range (and beyond) round-trip exactly.
 *
 * Only the digits valid for the given base are accepted (no sign, no
 * separators, no `0x`/`0b` prefixes). Throws on empty input or any character
 * that is not a valid digit for the base.
 */
export function parseInBase(text: string, base: Base): bigint {
  const trimmed = text.trim()
  if (trimmed === '') {
    throw new Error('Enter a value')
  }

  const bigBase = BigInt(base)
  let result = 0n

  for (const char of trimmed) {
    const value = digitValue(char)
    if (value === -1 || value >= base) {
      throw new Error(`"${char}" is not a valid base ${base} digit`)
    }
    result = result * bigBase + BigInt(value)
  }

  return result
}

/** Formats a non-negative BigInt as text in the given base (hex letters uppercase). */
export function formatInBase(value: bigint, base: Base): string {
  if (value < 0n) {
    throw new Error('Negative values are not supported')
  }
  if (value === 0n) return '0'

  const bigBase = BigInt(base)
  let remaining = value
  let out = ''

  while (remaining > 0n) {
    const digit = Number(remaining % bigBase)
    out = DIGITS[digit] + out
    remaining /= bigBase
  }

  return out
}

export interface BaseFieldError {
  base: Base
  message: string
}

export function useBaseConverter() {
  const binary = ref('')
  const octal = ref('')
  const decimal = ref('')
  const hex = ref('')
  const error = ref<BaseFieldError | null>(null)

  const fields: Record<Base, Ref<string>> = {
    2: binary,
    8: octal,
    10: decimal,
    16: hex,
  }

  function syncFrom(base: Base) {
    const text = fields[base].value
    if (text.trim() === '') {
      error.value = null
      return
    }

    try {
      const value = parseInBase(text, base)
      error.value = null
      for (const other of BASES) {
        if (other !== base) {
          fields[other].value = formatInBase(value, other)
        }
      }
    } catch (err) {
      error.value = {
        base,
        message: err instanceof Error ? err.message : 'Invalid input',
      }
    }
  }

  function updateFromBinary() {
    syncFrom(2)
  }

  function updateFromOctal() {
    syncFrom(8)
  }

  function updateFromDecimal() {
    syncFrom(10)
  }

  function updateFromHex() {
    syncFrom(16)
  }

  return {
    binary,
    octal,
    decimal,
    hex,
    error,
    updateFromBinary,
    updateFromOctal,
    updateFromDecimal,
    updateFromHex,
  }
}
