import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CelsiusComponent } from './celsius.component';

describe('CelsiusComponent', () => {
  let component: CelsiusComponent;
  let fixture: ComponentFixture<CelsiusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
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
