import { TestBed } from '@angular/core/testing';

import { CurrenciesService } from './currencies.service';

import { HttpClientModule } from '@angular/common/http';


describe('CurrenciesService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientModule]
  }));

  it('should be created', () => {
    const service: CurrenciesService = TestBed.get(CurrenciesService);
    expect(service).toBeTruthy();
  });
});
