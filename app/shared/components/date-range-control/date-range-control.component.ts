import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, Optional, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, NgControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import {
  DateRange,
  DefaultMatCalendarRangeStrategy,
  MAT_DATE_RANGE_SELECTION_STRATEGY,
} from '@angular/material/datepicker';
import { MatFormFieldControl } from '@angular/material/form-field';
import { MatMenuTrigger } from '@angular/material/menu';
import { DATE_PIPE_FORMAT } from '@consts/date-consts';
import moment from 'moment';
import { Subject } from 'rxjs';
import { DateTimeRangeControlValue } from './models/date-time-range-control-value';
import { CommonModule } from '@angular/common';
import { materialModules } from '@shared/materials';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatMomentDateModule, provideMomentDateAdapter } from '@angular/material-moment-adapter';
export const DATE_MOMENT_FORMAT = 'dd.mm.yyyy';
import './consts/moment-ru';
@Component({
  selector: 'app-date-range-control',
  templateUrl: './date-range-control.component.html',
  styleUrls: ['./date-range-control.component.scss'],
  imports: [
    CommonModule,
    MatNativeDateModule,
    MatMomentDateModule,
    materialModules.matIconModule,
    materialModules.matDatepickerModule,
    materialModules.matMenuModule,
    materialModules.reactiveFormsModule,
    materialModules.matButtonModule,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: DateRangeControlComponent },
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: DefaultMatCalendarRangeStrategy,
    },
    { provide: MAT_DATE_LOCALE, useValue: 'ru' },
    provideMomentDateAdapter({
      parse: {
        dateInput: DATE_MOMENT_FORMAT,
      },
      display: {
        dateInput: DATE_MOMENT_FORMAT,
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
      },
    }),
  ],
  host: {
    '[class.date-time-range-control-container]': 'shouldLabelFloat',
    '[id]': 'id',
  },
})
export class DateRangeControlComponent implements ControlValueAccessor, MatFormFieldControl<any>, OnInit, OnDestroy {
  static nextId = 0;
  DATE_PIPE_FORMAT = DATE_PIPE_FORMAT;
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger | null = null;

  @Input() min: moment.Moment | null = null;
  @Input() max: moment.Moment | null = moment();
  startMax: moment.Moment | null = null;
  endMin: moment.Moment | null = null;

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(plh: string) {
    this._placeholder = plh;
    this.stateChanges.next();
  }

  @Input()
  get required() {
    return this._required;
  }
  set required(req) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    if (this._disabled) {
      this.form.disable();
    } else {
      this.form.enable();
    }
    this.stateChanges.next();
  }

  @Input() value: DateTimeRangeControlValue | undefined = undefined;

  @HostBinding() id = `date-time-input-${DateRangeControlComponent.nextId++}`;

  private _placeholder = '';
  private _required = false;
  private _disabled = false;

  selectedDateRange: DateRange<Date> | undefined;
  stateChanges = new Subject<void>();

  displayStart: moment.Moment | null = null;
  displayEnd: moment.Moment | null = null;

  form = new UntypedFormGroup({
    start: new UntypedFormControl(null, Validators.required),
    end: new UntypedFormControl(null, Validators.required),
  });

  focused = false;

  get empty() {
    return !this.value?.start && !this.value?.end;
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  onFocusIn() {
    this.focused = true;
    this.stateChanges.next();
  }

  onFocusOut() {
    this.focused = false;
    this.stateChanges.next();
  }

  get errorState(): boolean {
    return this.ngControl?.errors !== null && !!this.ngControl?.touched;
  }

  constructor(
    @Optional() @Self() public ngControl: NgControl,
    private _elementRef: ElementRef<HTMLElement>,
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  onContainerClick(event: MouseEvent) {
    if (!this.focused && !this.disabled) {
      this.focused = true;
      this.stateChanges.next();
    }
    if (!this.disabled && this.menuTrigger) {
      this.menuTrigger.toggleMenu();
    }
  }

  setDescribedByIds(ids: string[]) {
    const controlElement = this._elementRef.nativeElement.querySelector('.date-time-range-control-container');
    controlElement?.setAttribute('aria-describedby', ids.join(' '));
  }

  writeValue(value: DateTimeRangeControlValue) {
    this.value = value;
    this.setFormByValue();
  }

  propagateChange = (_: any) => {};

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  onChange = (_: any) => {};
  onTouched = () => {};

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    if (isDisabled) {
      this.form.disable();
    } else {
      this.form.enable();
    }
    this.disabled = isDisabled;
  }

  submit() {
    this.value = this.getValueByForm();
    this.propagateChange(this.value);
    this.displayStart = this.form.value.start;
    this.displayEnd = this.form.value.end;
    this.focused = false;
    this.onTouched();
    this.stateChanges.next();
  }

  close() {
    this.menuTrigger?.closeMenu();
  }

  getValueByForm() {
    const start = this.form.value.start ? this.form.value.start : null;
    const end = this.form.value.end
      ? moment(this.form.value.end).add(1, 'day').startOf('day').subtract(1, 'second')
      : null;
    return {
      start,
      end,
    };
  }

  setFormByValue() {
    if (!this.value) {
      this.form.reset();
    } else {
      if (!moment.isMoment(this.value.start) && this.value.start) {
        this.value.start = moment(this.value.start);
      }
      if (!moment.isMoment(this.value.end) && this.value.end) {
        this.value.end = moment(this.value.end);
      }
      this.form.setValue({
        start: this.value?.start?.clone() || null,
        end: this.value?.end?.clone() || null,
      });
      this.displayStart = this.form.value.start;
      this.displayEnd = this.form.value.end;
    }
  }

  _onSelectedChange(date: Date, type: 'start' | 'end'): void {
    if (type === 'start') {
      this.form.get('start')?.setValue(date);
      this.endMin = moment(date);
      if (moment(this.form.get('start')?.value).isAfter(moment(this.form.get('end')?.value))) {
        this.form.get('end')?.reset();
      }
    } else {
      this.form.get('end')?.setValue(date);
      this.startMax = moment(date);
      if (moment(this.form.get('end')?.value).isBefore(moment(this.form.get('start')?.value))) {
        this.form.get('start')?.reset();
      }
    }
  }

  ngOnInit(): void {
    this.displayStart = this.value?.start ?? null;
    this.displayEnd = this.value?.end ?? null;
    if (!this.required) {
      this.required = this.ngControl?.control?.hasValidator(Validators.required) ?? false;
    }
  }

  ngOnDestroy() {
    this.stateChanges.complete();
  }
}
