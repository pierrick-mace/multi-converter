import { Component, OnInit } from '@angular/core';
import { CurrenciesService } from '../service/currencies.service';
import { Currency } from './currencies.response';


@Component({
  selector: 'app-currencies',
  templateUrl: './currencies.component.html',
  styleUrls: ['./currencies.component.scss']
})

export class CurrenciesComponent implements OnInit {

  currencies: Currency[];
  selectedCurrency: Currency;
  selectedCurrencyRates: Currency[];
  targetCurrency: Currency;
  amountToConvert: number;
  amountConverted: number;

  constructor(private currenciesService: CurrenciesService) { }

  ngOnInit() {
    this.amountConverted = 0;
    this.currenciesService.getAllCurrenciesRate().subscribe(data => {
      this.currencies = Object.keys(data.rates).map(name => ({ name, value: data.rates[name] }));
      this.currencies.push({
        name: 'EUR',
        value: 1.0
      });

      this.currencies.sort((a, b) => Number(a.name > b.name));

      this.selectedCurrency = this.currencies.filter(elem => elem.name === 'EUR')[0];
      this.targetCurrency = this.currencies.filter(elem => elem.name === 'USD')[0];

      this.updateCurrencyRates();

      console.log(this.currencies);
    });
  }

  updateCurrencyRates() {
    this.currenciesService.getRatesForCurrency(this.selectedCurrency.name).subscribe(data => {
      this.selectedCurrencyRates = Object.keys(data.rates).map(name => ({ name, value: data.rates[name] }));
      this.selectedCurrencyRates.push(this.selectedCurrency);
      this.updateTargetValue();
    });
  }

  updateTargetValue() {
    this.amountConverted = this.amountToConvert *
    this.selectedCurrencyRates.filter(elem => elem.name === this.targetCurrency.name)[0].value;
  }

}
