import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostBinding, Inject, Input, Optional, Self } from '@angular/core';
import { ControlValueAccessor, NgControl, Validators } from '@angular/forms';
import { MAT_FORM_FIELD, MatFormField, MatFormFieldControl } from '@angular/material/form-field';
import { ActivatedRoute } from '@angular/router';
import { OverFlowTooltipDirective } from '@shared/directives';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-file-select-control',
  imports: [CommonModule, OverFlowTooltipDirective],
  providers: [{ provide: MatFormFieldControl, useExisting: FileSelectControlComponent }],
  templateUrl: './file-select-control.component.html',
  styleUrl: './file-select-control.component.scss',
})
export class FileSelectControlComponent implements ControlValueAccessor, MatFormFieldControl<FileList | null> {
  static nextId = 0;
  @HostBinding('attr.aria-expanded') expanded = false;
  @HostBinding('id') id = `file-select-control-${FileSelectControlComponent.nextId++}`;
  @Input() multiple: boolean = false;
  @Input() accept: string = '';
  stateChanges = new Subject<void>();
  focused = false;
  touched = false;
  private fileControl: HTMLInputElement | null = null;
  private _disabled = false;
  private _placeholder: string;
  private _required = false;
  constructor(
    private _elementRef: ElementRef<HTMLElement>,
    protected activatedRoute: ActivatedRoute,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl,
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }
  writeValue(value: FileList | null) {
    this.value = value;
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

  @Input()
  get value(): FileList | null {
    if (!this.fileControl) {
      return null;
    }
    return this.fileControl.files;
  }

  set value(value: FileList | null) {
    if (!this.fileControl) {
      return;
    }
    this.fileControl.files = value;
    if (!value) {
      this.fileControl.value = '';
    }
  }

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }

  get empty() {
    return !this.fileControl?.files || !this.fileControl.files.length;
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input()
  get required(): boolean {
    return this._required;
  }

  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  get errorState(): boolean {
    return this.ngControl?.errors !== null && !!this.ngControl?.errors;
  }
  get fileNames(): string {
    if (!this.fileControl?.files?.length) {
      return '';
    }
    const names: string[] = [];
    for (let i = 0; i < this.fileControl.files.length; i++) {
      names.push(this.fileControl.files[i].name);
    }
    return names.join(', ');
  }
  setDescribedByIds(ids: string[]) {
    const controlElement = this._elementRef.nativeElement.querySelector('.tree-controller-container');
    if (!controlElement) {
      return;
    }
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }
  openFileinput() {
    if (!this.disabled) {
      this.fileControl?.click();
    }
  }
  onContainerClick() {
    if (!this.focused && !this.disabled) {
      this.focused = true;
      this.stateChanges.next();
    }
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.fileControl = <HTMLInputElement>document.getElementById('file_input');
      if (!this.fileControl) {
        return;
      }
      this.fileControl.onchange = () => {
        this.propagateChange(this.fileControl?.files);
      };
    }, 300);
  }
  ngOnInit() {
    this.required = this.ngControl?.control?.hasValidator(Validators.required) ?? false;
  }
}
