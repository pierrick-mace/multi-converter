import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../currencies/currencies.response';

const API_URL = 'https://api.exchangeratesapi.io';

@Injectable({
  providedIn: 'root'
})

export class CurrenciesService {


  constructor(private http: HttpClient) { }

  getAllCurrenciesRate() {
    return this.http.get<ApiResponse>(API_URL + '/latest');
  }

}
