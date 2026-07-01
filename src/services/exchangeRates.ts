import type { ExchangeRatesResponse, RateHistoryResponse } from '@/types/currency'

const API_BASE = 'https://api.frankfurter.dev/v1'

export async function fetchRates(base?: string): Promise<ExchangeRatesResponse> {
  const url = base ? `${API_BASE}/latest?base=${base}` : `${API_BASE}/latest`
  const response = await fetch(url)
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
