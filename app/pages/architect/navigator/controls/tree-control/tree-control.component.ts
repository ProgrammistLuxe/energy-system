import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostBinding,
  Inject,
  Input,
  Optional,
  Self,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NgControl, Validators } from '@angular/forms';
import { MAT_FORM_FIELD, MatFormField, MatFormFieldControl } from '@angular/material/form-field';
import { MatMenuTrigger } from '@angular/material/menu';
import { materialModules } from '@shared/materials';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { TreeControlService } from './services/tree-control.service';
import { TreeComponent } from './tree/tree.component';
import { AttributesLinkData } from '@api-calls/services/http-graph-service/models';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ShowAllPropertiesDirective } from './directives/show-all-properties.directive';
export class TreeControl {
  constructor(
    public checked: Array<string> = [],
    public selected: string = '',
  ) {}
}

@Component({
  selector: 'app-tree-control',
  imports: [
    CommonModule,
    materialModules.matMenuModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    ShowAllPropertiesDirective,
    TreeComponent,
    RouterModule,
  ],
  providers: [TreeControlService, { provide: MatFormFieldControl, useExisting: TreeControlComponent }],
  templateUrl: './tree-control.component.html',
  styleUrl: './tree-control.component.scss',
})
export class TreeControlComponent implements ControlValueAccessor, MatFormFieldControl<string[] | string> {
  static nextId = 0;
  @HostBinding('attr.aria-expanded') expanded = false;
  @HostBinding('id') id = `tree-control-${TreeControlComponent.nextId++}`;
  @ViewChild('menuTrigger') menuTrigger: MatMenuTrigger | null = null;
  @Input() singleSelection: boolean = false;
  @Input() class_name: string = '';
  @Input() initialSelectedNodes: AttributesLinkData[] = [];
  stateChanges = new Subject<void>();
  focused = false;
  touched = false;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private _disabled = false;
  private _placeholder: string;
  private _required = false;
  constructor(
    private treeControlService: TreeControlService,
    private _elementRef: ElementRef<HTMLElement>,
    protected activatedRoute: ActivatedRoute,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl,
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }
  get selectedNodes() {
    return this.treeControlService.selectedNodes;
  }
  writeValue(value: string[] | string) {
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
  get value(): string | string[] {
    if (this.singleSelection) {
      return this.treeControlService.selectedNode;
    } else {
      return this.treeControlService.checkedNodes;
    }
  }

  set value(value: string[] | string) {
    if (Array.isArray(value)) {
      this.treeControlService.checkedNodes = value;
    } else {
      this.treeControlService.selectedNode = value;
    }
  }

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }

  get empty() {
    return !this.treeControlService.checkedNodes.length && !this.treeControlService.selectedNode;
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
    if (this.required) {
      return this.empty;
    }
    return false;
  }

  get selectedCount(): number {
    if (!this.value) {
      return 0;
    }
    if (!this.singleSelection) {
      return this.value.length;
    }

    if (this.value) {
      return 1;
    }

    return 0;
  }

  setDescribedByIds(ids: string[]) {
    const controlElement = this._elementRef.nativeElement.querySelector('.tree-controller-container');
    if (!controlElement) {
      return;
    }
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  onContainerClick() {
    if (!this.menuTrigger) {
      return;
    }
    if (!this.focused && !this.disabled) {
      this.focused = true;
      this.stateChanges.next();
    }
    if (!this.disabled) {
      this.menuTrigger.openMenu();
    }
  }
  onMenuOpen() {
    this.treeControlService.loadTree = true;
  }
  onMenuClose() {
    this.touched = true;
    this.focused = false;
    this.onTouched();
    this.stateChanges.next();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['class_name']?.currentValue) {
      this.treeControlService.selectedClassName = this.class_name;
    }
    if (changes['initialSelectedNodes']?.currentValue) {
      this.treeControlService.selectedNodes = this.initialSelectedNodes;
    }
  }
  ngOnInit() {
    this.required = this.ngControl?.control?.hasValidator(Validators.required) ?? false;
    this.treeControlService.selectedNode$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.onChange(this.value);
      this.propagateChange(this.value);
    });
    this.treeControlService.checkedNodes$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.onChange(this.value);
      this.propagateChange(this.value);
    });
  }
  ngOnDestroy() {
    this.treeControlService.selectedNodes = [];
    this.destroy$.next();
    this.destroy$.complete();
  }
}
