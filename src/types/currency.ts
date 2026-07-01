export interface Currency {
  code: string
  rate: number
}

export interface ExchangeRatesResponse {
  base: string
  date: string
  rates: Record<string, number>
}
