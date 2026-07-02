import type { ExchangeRatesResponse, RateHistoryResponse } from '@/types/currency'

const API_BASE = 'https://api.frankfurter.dev/v1'

export async function fetchRates(base?: string, symbols?: string): Promise<ExchangeRatesResponse> {
  const params = [base ? `base=${base}` : '', symbols ? `symbols=${symbols}` : '']
    .filter(Boolean)
    .join('&')
  const url = params ? `${API_BASE}/latest?${params}` : `${API_BASE}/latest`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.status}`)
  }
  return response.json()
}

/**
 * Fetches rates as of a given date. Frankfurter resolves any non-trading day
 * (weekend, holiday) to the closest trading day at or before it, so callers
 * should read the resolved date back off the response rather than assume it
 * echoes the requested one.
 */
export async function fetchRatesOn(
  date: string,
  base: string,
  symbols?: string,
): Promise<ExchangeRatesResponse> {
  const symbolParam = symbols ? `&symbols=${symbols}` : ''
  const response = await fetch(`${API_BASE}/${date}?base=${base}${symbolParam}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.status}`)
  }
  return response.json()
}

export async function fetchRateHistory(
  base: string,
  symbol: string,
  startDate: string,
): Promise<RateHistoryResponse> {
  const response = await fetch(`${API_BASE}/${startDate}..?base=${base}&symbols=${symbol}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch rate history: ${response.status}`)
  }
  return response.json()
}
