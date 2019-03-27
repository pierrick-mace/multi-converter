export interface Currency {
  name: string;
  value: number;
}

export interface ApiResponse {
  base: string;
  rates: Currency[];
  date: string;
}
