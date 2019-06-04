import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-temperature',
  templateUrl: './temperature.component.html',
  styleUrls: ['./temperature.component.scss']
})
export class TemperatureComponent implements OnInit {
  celsius: number;
  farenheit: number;
  kelvin: number;

  constructor() { }

  ngOnInit() {
  }

  updateCelsius() {
    this.kelvin = +this.celsius + +273.15;
    this.farenheit = (this.celsius * 9 / 5) + 32;
  }

  updateFarenheit() {
    this.celsius = (this.farenheit - 32) * 5 / 9;
    this.kelvin = (this.farenheit - 32) * 5 / 9 + 273.15;
  }

  updateKelvin() {
    this.celsius = this.kelvin - 273.15;
    this.farenheit = (this.kelvin - 273.15) * 9 / 5 + 32;
  }

}
