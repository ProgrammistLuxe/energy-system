import { Component, EventEmitter } from '@angular/core';
import { ReplaySubject, BehaviorSubject, finalize, takeUntil } from 'rxjs';
import { NavigatorService } from '../../services/navigator.service';
import { CommonModule } from '@angular/common';
import {
  SearchFieldComponent,
  EmptyTemplateComponent,
  FooterComponent,
  ApiResolverComponent,
  MatErrorExtComponent,
} from '@shared/components';
import { ButtonLoadingDirective, CheckScrollDirective, OpenInNewTabDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';
import { CompareDataService, NotificationsService } from '@services';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import {
  NavigatorGenerateDiffsService,
  PassportTemplateDifference,
} from '../../services/navigator-generate-diffs.service';
import { DiffService, DiffItem } from '@features/active-diffs-table/services/diff.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AttributesLinkData,
  GetAttributesData,
  GetGraphClassSearchDataItem,
  GetGraphClassSearchReq,
} from '@api-calls/services/http-graph-service/models';
import { CanComponentDeactivate } from '@core/guards/deactivate-guard.service';
import { TreeControlComponent } from '../../controls/tree-control/tree-control.component';
import { GetControlPipe } from '../../pipes/get-control.pipe';
import { DefaultPipe, MatIconButtonCustomDirective } from '@shared/index';
import { OverFlowTooltipDirective } from '@shared/directives';
import { GEO_DATA_CLASSES } from '@core/consts/geo-data-classes';
import { PassportsTreeComponent } from '@features/index';
import { AngularSplitModule } from 'angular-split';
import { PassportsTreeService } from '@features/passports-tree/services/passports-tree.service';

interface ReferenceOption {
  uid: string;
  name: string;
}
interface FormData {
  key: string;
  label: string;
  value: any;
  type: string;
  predicate: string;
  validators: ValidatorFn[];
  isMulti: boolean;
  isReference: boolean;
  library?: boolean | undefined;
  data?: AttributesLinkData[] | undefined;
  selectedOptionsList?: ReferenceOption[] | undefined;
  class_name?: string | undefined;
  optionList?: ReferenceOption[] | undefined;
}
const typeNumberVariables = ['integer', 'decimal', 'Число с плавающей точкой', 'pos_integer', 'Целое число'];
const typeStringVariables = [
  'string',
  'date',
  'datetime',
  'pos_integer',
  'StreetAddress',
  'ElectronicAddress',
  'DateTime',
  'uuid',
  'TelephoneNumber',
];
const typeBooleanVariables = ['Логическое', 'boolean'];
@Component({
  selector: 'app-object-data',
  imports: [
    CommonModule,
    ApiResolverComponent,
    ButtonLoadingDirective,
    FooterComponent,
    MatErrorExtComponent,
    CheckScrollDirective,
    OpenInNewTabDirective,
    TreeControlComponent,
    RouterModule,
    DefaultPipe,
    OverFlowTooltipDirective,
    PassportsTreeComponent,
    AngularSplitModule,
    materialModules.matButtonToggleModule,
    materialModules.matProgressSpinnerModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    materialModules.matMenuModule,
    materialModules.matButtonModule,
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matSelectModule,
    materialModules.matOptionModule,
    materialModules.matCheckBoxModule,
    materialModules.matTooltipModule,
    materialModules.matIconModule,
    MatIconButtonCustomDirective,
    SearchFieldComponent,
    EmptyTemplateComponent,
  ],
  templateUrl: './object-data.component.html',
  styleUrl: './object-data.component.scss',
})
export class ObjectDataComponent implements CanComponentDeactivate {
  loading: boolean = false;
  saveLoading: boolean = false;
  formFields: FormData[] = [];
  filteredFormFields: FormData[] = [];
  errorCode: number | null = null;
  errorMessage: string | null = null;
  form: FormGroup = this.fb.nonNullable.group({});
  listLoading: boolean = false;
  listData: GetGraphClassSearchDataItem[] = [];
  objectUID: string | null = null;
  showDisplayOnMapBtn: boolean = false;
  objectType: string = '';
  resetSearchValue: EventEmitter<void> = new EventEmitter<void>();
  private searchValue: string = '';
  private filterValue: 'all' | 'filled' | 'empty' = 'all';
  private selectClosed: boolean = false;
  private startFieldsValue: FormData[] = [];
  private formData$: BehaviorSubject<any> = new BehaviorSubject<any>({});

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private navigatorService: NavigatorService,
    private navigatorGenerateDiffsService: NavigatorGenerateDiffsService,
    private compareDataService: CompareDataService,
    private notificationsService: NotificationsService,
    private diffService: DiffService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private passportsTreeService: PassportsTreeService,
  ) {}

  get isTheSame() {
    return this.compareDataService.isTheSame;
  }
  get header() {
    return this.navigatorService.selectedNode?.name || 'Редактор объекта';
  }
  get isTreeOpened() {
    return !!this.passportsTreeService.selectedUID;
  }
  onConfirm(): boolean {
    return this.isTheSame;
  }
  resetTreeState() {
    this.passportsTreeService.clearTreeState();
  }
  selectOptionsData(field: FormData, opened: boolean) {
    if (!opened) {
      this.selectClosed = true;
      return;
    }
    this.selectClosed = false;
    this.searchOptions(field, '');
  }

  searchOptions(field: FormData, value: string) {
    if (this.selectClosed) {
      return;
    }
    if (!field.class_name) {
      return;
    }
    const class_name = field.class_name;
    if (!class_name) {
      return;
    }
    const searchValue: string = value.toLowerCase().trim();
    this.listLoading = true;
    const reqData: GetGraphClassSearchReq = {
      class_name: class_name,
      text: searchValue,
    };
    this.navigatorService
      .getGraphInstanceListByName(reqData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.listLoading = false)),
      )
      .subscribe((res) => {
        if (res.error) {
          const message = getErrorsMessage(res.error) || 'Ошибка получения списка';
          this.notificationsService.displayMessage('Ошибка', message, 'error', 3000);
          return;
        }
        const list = res.result.data;
        const value = this.form.controls[field.key]?.value;
        field.data =
          field.data?.filter((item) => {
            if (!value) {
              return false;
            }
            if (Array.isArray(value)) {
              return field.value.includes(item.uid);
            } else {
              return item.uid === value;
            }
          }) || [];

        field.data?.forEach((item) => {
          if (!list.map((el) => el.uid).includes(item.uid)) {
            list.push({ uid: item.uid, name: item.value });
          }
        });
        field.data = list.map((item) => ({ uid: item.uid, value: item.name || '' }));
      });
  }
  async saveData() {
    const data = this.form.value;
    if (!data || !this.objectUID) {
      return;
    }
    this.saveLoading = true;
    const difference: PassportTemplateDifference = {};
    Object.keys(data).forEach((key: string) => {
      const selectedField = this.startFieldsValue.find((field) => field.predicate.includes(key));
      if (!selectedField) {
        return;
      }
      let isTheSame = true;
      if (Array.isArray(data[key])) {
        isTheSame = JSON.stringify(data[key].sort()) === JSON.stringify(selectedField.value.sort());
      } else {
        isTheSame = JSON.stringify(data[key]) === JSON.stringify(selectedField.value);
      }

      if (!isTheSame) {
        difference[key] = {
          currentValue: data[key],
          oldValue: selectedField.value,
          predicate: selectedField.predicate,
          isReference: selectedField.isReference,
        };
      }
    });
    const diff: string = this.navigatorGenerateDiffsService.generateDiff(
      difference,
      this.objectUID,
      this.objectType,
      'edit',
    );
    this.saveLoading = true;
    const res = await this.diffService.saveDiff(diff);
    res
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response) {
          this.notificationsService.displayMessage('Ошибка', 'Ошибка сохранения', 'error');
          return;
        }
        if (response.error) {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка сохранения';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
          return;
        }
        this.notificationsService.displayMessage('Успешно', 'Успешно сохранено', 'success', 3000);
        this.startFieldsValue = JSON.parse(JSON.stringify(this.formFields));
        this.registerCompareDataObserver();
        if (!response.result.data.length || !this.objectUID) {
          return;
        }
        const currentItem = this.navigatorService.selectedNode;
        let name = '';
        if (!currentItem || !('uid' in currentItem)) {
          name = 'Редактирование объекта';
        } else {
          name = currentItem?.name || '';
        }
        const computedDiff: DiffItem = {
          diff_id: response.result.data[0].id,
          diff_name: response.result.data[0].object_name,
          place_name: name,
        };
        this.diffService.insertIntoDiffList(computedDiff);
      });
  }
  updateSearchValue(value: string) {
    this.searchValue = value.trim().toLowerCase();
    this.searchFormFields();
  }

  updateFilterValue(value: 'all' | 'filled' | 'empty') {
    this.filterValue = value;
    this.filterFormFields();
  }
  openInTree() {
    if (!this.objectUID) {
      return;
    }
    this.passportsTreeService.selectedUID = this.objectUID;
  }
  getAttributesData() {
    this.errorCode = null;
    this.errorMessage = null;
    const uid = this.objectUID;
    if (!uid) {
      return;
    }
    this.loading = true;
    this.navigatorService
      .getGraphAttributes(uid)
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res.error) {
          this.errorMessage = String(res);
          this.errorCode = +res;
          return;
        }
        this.calculateFormGroup(res.result);
      });
  }
  navigateToAttrs(event: MouseEvent, uid: string) {
    event.stopPropagation();
    this.router.navigate(['../', uid], { relativeTo: this.route });
  }
  private searchFormFields() {
    if (this.searchValue) {
      this.filteredFormFields = this.formFields.filter((item) => item.label.toLowerCase().includes(this.searchValue));
    } else {
      this.filteredFormFields = structuredClone(this.formFields);
    }
    this.filterFormFields();
  }
  private getFieldType(type: string) {
    if (typeStringVariables.includes(type)) {
      return 'string';
    }
    if (typeNumberVariables.includes(type)) {
      return 'number';
    }
    if (typeBooleanVariables.includes(type)) {
      return 'boolean';
    }
    return 'class';
  }
  private filterFormFields() {
    switch (this.filterValue) {
      case 'all': {
        this.filteredFormFields = structuredClone(this.formFields).filter((item) =>
          item.label.toLowerCase().includes(this.searchValue),
        );
        return;
      }
      case 'empty': {
        this.filteredFormFields = this.formFields
          .filter((field) => {
            const value = this.form.controls[field.key]?.value;
            if (Array.isArray(value)) {
              return !value.length;
            } else return !value;
          })
          .filter((item) => item.label.toLowerCase().includes(this.searchValue));
        return;
      }
      case 'filled': {
        this.filteredFormFields = this.formFields
          .filter((field) => {
            const value = this.form.controls[field.key]?.value;
            if (Array.isArray(value)) {
              return !!value.length;
            } else return !!value;
          })
          .filter((item) => item.label.toLowerCase().includes(this.searchValue));
        return;
      }
    }
  }
  private calculateFormGroup(data: GetAttributesData) {
    this.objectType = data.type;
    this.formFields = [];
    this.form.reset();
    this.form = this.fb.nonNullable.group({});
    const primitiveTypes = ['boolean', 'string', 'number'];
    data.names.forEach((el) => {
      const type = this.getFieldType(el.type);
      const fieldKey = el.predicate.split(':')[1] || el.label;
      const field: FormData = {
        key: fieldKey,
        isReference: !primitiveTypes.includes(type),
        label: el.description,
        value: el.value,
        predicate: el.predicate,
        type,
        isMulti: false,
        validators: [],
      };
      const value = this.convertValue(field.type, field.value);
      this.form.addControl(field.key, new FormControl(value, { validators: field.validators, nonNullable: true }));
      this.formFields.push(field);
    });
    data.links.forEach((link) => {
      const type = this.getFieldType(link.predicate.split(':')[1]);
      const fieldKey = link.predicate.split(':')[1] || link.label;
      const field: FormData = {
        key: fieldKey,
        label: link.description,
        value: this.getFieldValue(link.data, link.multiplicity),
        data: link.data,
        predicate: link.predicate,
        type,
        isReference: true,
        library: link.library,
        class_name: link.class_name,
        validators: [],
        isMulti: ['0..*', '1..*'].includes(link.multiplicity),
      };
      field.optionList = field.selectedOptionsList;

      if (link.multiplicity === '1..1' || link.multiplicity === '1..*') {
        field.validators.push(Validators.required);
      }

      this.form.addControl(
        field.key,
        new FormControl(field.value, { validators: field.validators, nonNullable: true }),
      );
      this.formFields.push(field);
    });
    this.startFieldsValue = JSON.parse(JSON.stringify(this.formFields));
    this.filteredFormFields = structuredClone(this.formFields);
    this.registerCompareDataObserver();
    this.resetSearchValue.emit();
    this.filterFormFields();
  }
  private getFieldValue(data: AttributesLinkData[], multiplicity: string): string[] | string {
    if (['0..*', '1..*'].includes(multiplicity)) {
      return data.map((item) => item.uid);
    }
    return data[0]?.uid || '';
  }
  private convertValue(type: string, value: unknown) {
    if (value === null || value === undefined) {
      return value;
    }
    switch (type) {
      case 'boolean': {
        return !!value;
      }
      case 'number': {
        return Number(value);
      }
      case 'string': {
        return String(value);
      }
      default: {
        return value;
      }
    }
  }
  private registerCompareDataObserver() {
    this.formData$.next(this.form.value);
    this.compareDataService.registerValues(this.form.value, this.formData$);
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.formData$.next(data);
    });
  }
  ngOnInit() {
    this.navigatorService.selectedUid$.pipe(takeUntil(this.destroy$)).subscribe((uid) => {
      if (!uid) {
        return;
      }
      this.objectUID = uid;
      this.getAttributesData();
    });
    this.navigatorService.selectedNode$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (!data) {
        this.showDisplayOnMapBtn = false;
        return;
      }
      this.showDisplayOnMapBtn = GEO_DATA_CLASSES.includes(data.className);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.passportsTreeService.clearTreeState();
  }
}
