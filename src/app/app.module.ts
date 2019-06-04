import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { ClipboardModule } from 'ngx-clipboard';

import { AppComponent } from './app.component';
import { TemperatureComponent } from './temperature/temperature.component';
import { NavbarComponent } from './navbar/navbar.component';
import { HomeComponent } from './home/home.component';
import { CurrenciesComponent } from './currencies/currencies.component';

export const appRoutes: Routes = [
  { path: 'temperature', component: TemperatureComponent },
  { path: 'home', component: HomeComponent },
  { path: 'currencies', component: CurrenciesComponent },
  { path: '',   redirectTo: '/home', pathMatch: 'full' },
  { path: '**', component: HomeComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    TemperatureComponent,
    NavbarComponent,
    HomeComponent,
    CurrenciesComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forRoot(appRoutes),
    ClipboardModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
