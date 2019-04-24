import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { CelsiusComponent } from './celsius/celsius.component';
import { HomeComponent } from './home/home.component';
import { CurrenciesComponent } from './currencies/currencies.component';

import { appRoutes } from './app.module';
import { RouterModule } from '@angular/router';
import { ClipboardModule } from 'ngx-clipboard';
import { FormsModule } from '@angular/forms';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot(appRoutes),
        ClipboardModule,
        FormsModule
      ],
      declarations: [
        AppComponent,
        NavbarComponent,
        CelsiusComponent,
        HomeComponent,
        CurrenciesComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'converter'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('converter');
  });
});
