import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../model/currencies';

const API_URL = 'https://api.exchangeratesapi.io';

@Injectable({
  providedIn: 'root'
})

export class CurrenciesService {


  constructor(private http: HttpClient) { }

  getAllCurrenciesRate() {
    return this.http.get<ApiResponse>(API_URL + '/latest');
  }

  getRatesForCurrency(name: string) {
    return this.http.get<ApiResponse>(API_URL + '/latest?base=' + name);
  }

}
