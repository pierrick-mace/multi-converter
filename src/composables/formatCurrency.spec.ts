import { describe, expect, it } from 'vitest'
import { formatCurrencyAmount } from './formatCurrency'

describe('formatCurrencyAmount', () => {
  it('formats a USD amount with the dollar symbol and two decimals', () => {
    expect(formatCurrencyAmount(1234.5, 'USD')).toBe('$1,234.50')
  })

  it('formats a EUR amount using the euro symbol', () => {
    expect(formatCurrencyAmount(99, 'EUR')).toBe('€99.00')
  })

  it('formats a JPY amount with no decimal places', () => {
    expect(formatCurrencyAmount(1000, 'JPY')).toBe('¥1,000')
  })

  it("rounds to the currency's minor unit", () => {
    expect(formatCurrencyAmount(0.005, 'USD')).toBe('$0.01')
  })
})