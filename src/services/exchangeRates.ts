import type { ExchangeRatesResponse } from '@/types/currency'

const API_URL = 'https://api.frankfurter.dev/v1/latest'

export async function fetchRates(base?: string): Promise<ExchangeRatesResponse> {
  const url = base ? `${API_URL}?base=${base}` : API_URL
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.status}`)
  }
  return response.json()
}
