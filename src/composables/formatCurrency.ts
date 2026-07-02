/**
 * Formats a numeric amount as currency, using the target currency's ISO code
 * for both the symbol/format and the locale-appropriate grouping. Kept as a
 * pure, standalone helper so the formatting rules are directly testable
 * without mounting `CurrenciesView`.
 */
export function formatCurrencyAmount(value: number, code: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency: code }).format(value)
}