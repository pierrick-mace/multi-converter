export class Currency {
  name: string;
  value: number;

  constructor(name: string, value: number) {
    this.name = name;
    this.value = value;
  }
}

export interface ApiResponse {
  base: string;
  rates: Currency[];
  date: string;
}
