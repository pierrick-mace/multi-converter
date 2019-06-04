import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TemperatureComponent } from './temperature.component';

import { ClipboardModule } from 'ngx-clipboard';
import { FormsModule } from '@angular/forms';


describe('TemperatureComponent', () => {
  let component: TemperatureComponent;
  let fixture: ComponentFixture<TemperatureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ClipboardModule,
        FormsModule
      ],
      declarations: [ TemperatureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TemperatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
