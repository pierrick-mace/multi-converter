import { Component, OnInit } from '@angular/core';
import { CurrenciesService } from '../service/currencies.service';
import { ApiResponse } from './currencies.response';


@Component({
  selector: 'app-currencies',
  templateUrl: './currencies.component.html',
  styleUrls: ['./currencies.component.scss']
})

export class CurrenciesComponent implements OnInit {

  currencyRates: ApiResponse;

  constructor(private currenciesService: CurrenciesService) { }

  ngOnInit() {
    this.currenciesService.getAllCurrenciesRate().subscribe(data => {
      this.currencyRates = data;
      this.currencyRates.rates = Object.keys(this.currencyRates.rates).map(name => ({ name, value: this.currencyRates.rates[name] }));
      console.log(this.currencyRates);
    });
  }

}
