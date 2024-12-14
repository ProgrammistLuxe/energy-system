import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Host,
  Input,
  Optional,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { materialModules } from '@shared/index';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, ReplaySubject, debounceTime, takeUntil } from 'rxjs';
import { MatSelect } from '@angular/material/select';
@Component({
  selector: 'app-search-field',
  imports: [
    CommonModule,
    materialModules.matInputModule,
    materialModules.matFormFieldModule,
    materialModules.reactiveFormsModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
  ],
  templateUrl: './search-field.component.html',
  styleUrl: './search-field.component.scss',
})
export class SearchFieldComponent {
  @Output() search: EventEmitter<string> = new EventEmitter<string>();
  @Input() initialSearchString: string = '';
  @Input() fieldsToSearch: string[] | 'all' | null = null;
  @Input() resetValue: EventEmitter<void> = new EventEmitter<void>();
  searchControl: FormControl<string> = new FormControl<string>('', { nonNullable: true });
  tooltipContent: string = '';
  constructor(@Optional() @Host() private matSelect: MatSelect) {}
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  ngOnChanges(changes: SimpleChanges) {
    const searchValue = changes['initialSearchString']?.currentValue ?? null;
    if (searchValue !== null) {
      this.searchControl.setValue(this.initialSearchString, { emitEvent: false });
    }
    if (!changes['fieldsToSearch']?.currentValue) {
      return;
    }
    if (!this.fieldsToSearch) {
      this.tooltipContent = '';
      return;
    }
    if (Array.isArray(this.fieldsToSearch)) {
      this.tooltipContent = 'Посик работает по колонкам: ' + this.fieldsToSearch.join(', ') + '.';
      return;
    }
    if (this.fieldsToSearch === 'all') {
      this.tooltipContent = 'Посик работает по всем колонкам';
      return;
    }
  }
  ngOnInit() {
    this.resetValue.subscribe(() => {
      this.searchControl.setValue('');
    });
    this.searchControl.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(500)).subscribe((value) => {
      this.search.emit(value);
    });
    if (this.matSelect) {
      this.matSelect.openedChange.subscribe((e) => {
        if (!e) {
          this.searchControl.reset();
        }
      });
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
