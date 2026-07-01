export interface Currency {
  code: string
  rate: number
}

export interface ExchangeRatesResponse {
  base: string
  date: string
  rates: Record<string, number>
}

export interface RateHistoryResponse {
  base: string
  start_date: string
  end_date: string
  rates: Record<string, Record<string, number>>
}

export interface RatePoint {
  date: string
  rate: number
}
