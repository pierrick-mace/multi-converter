import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CelsiusComponent } from './celsius.component';

import { ClipboardModule } from 'ngx-clipboard';
import { FormsModule } from '@angular/forms';


describe('CelsiusComponent', () => {
  let component: CelsiusComponent;
  let fixture: ComponentFixture<CelsiusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ClipboardModule,
        FormsModule
      ],
      declarations: [ CelsiusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CelsiusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
