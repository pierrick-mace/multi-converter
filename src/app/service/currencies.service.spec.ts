import { TestBed } from '@angular/core/testing';

import { CurrenciesService } from './currencies.service';

import { HttpClientModule } from '@angular/common/http';

import { Currency } from '../model/currencies';


describe('CurrenciesService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientModule]
  }));

  it('should be created', () => {
    const service: CurrenciesService = TestBed.get(CurrenciesService);
    expect(service).toBeTruthy();
  });

  it('getAllCurrenciesRate should return currency rates based on EURO', () => {
    const service: CurrenciesService = TestBed.get(CurrenciesService);

    service.getAllCurrenciesRate().subscribe(data => {
      expect(data.base).toBe('EUR');
    });
  });

  it('getAllCurrenciesRate should return an array containing currency rates', () => {
    const service: CurrenciesService = TestBed.get(CurrenciesService);

    service.getAllCurrenciesRate().subscribe(data => {
      const currencies = Object.keys(data.rates).map(name => new Currency(name, data.rates[name]));

      expect(Array.isArray(currencies)).toBeTruthy();
      expect(currencies.every(item => item instanceof Currency)).toBeTruthy();
    });
  });
});
