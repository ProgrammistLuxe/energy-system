import { Component, EventEmitter, Inject } from '@angular/core';
import {
  NavigatorGenerateDiffsService,
  PassportTemplateDifference,
} from '../../services/navigator-generate-diffs.service';
import { NavigatorService } from '../../services/navigator.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppConfigService, NotificationsService } from '@services';
import { ReplaySubject, finalize, take, takeUntil } from 'rxjs';
import { DiffItem, DiffService } from '@features/active-diffs-table/services/diff.service';
import {
  ApiResolverComponent,
  EmptyTemplateComponent,
  MatErrorExtComponent,
  SearchFieldComponent,
} from '@shared/components';
import { materialModules } from '@shared/materials';
import { getCroppedName } from '@core/utils/cut-prefix';
import {
  ButtonLoadingDirective,
  CheckScrollDirective,
  MatIconButtonCustomDirective,
  OverFlowTooltipDirective,
} from '@shared/directives';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {
  ClassAskAttributesLinkData,
  GetClassAskDataRes,
  GetGraphClassSearchReq,
} from '@api-calls/services/http-graph-service/models';
import { TreeControlComponent } from '../../controls/tree-control/tree-control.component';
import { GetControlPipe } from '../../pipes/get-control.pipe';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { uid } from '@core/utils/uid';
import { DefaultPipe } from '@shared/pipes';

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
  data?: ClassAskAttributesLinkData[] | undefined;
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
  selector: 'app-create-entity',
  imports: [
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    materialModules.reactiveFormsModule,
    materialModules.matSelectModule,
    materialModules.matOptionModule,
    materialModules.matProgressSpinnerModule,
    materialModules.matButtonToggleModule,
    OverFlowTooltipDirective,
    DefaultPipe,
    SearchFieldComponent,
    ButtonLoadingDirective,
    GetControlPipe,
    EmptyTemplateComponent,
    ApiResolverComponent,
    CheckScrollDirective,
    MatErrorExtComponent,
    TreeControlComponent,
  ],
  providers: [NavigatorService, NavigatorGenerateDiffsService],
  templateUrl: './create-entity.component.html',
  styleUrl: './create-entity.component.scss',
})
export class CreateEntityComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { class_name: string },
    private appConfigService: AppConfigService,
    private generateDiffService: NavigatorGenerateDiffsService,
    private navigatorService: NavigatorService,
    private diffService: DiffService,
    private notificationsService: NotificationsService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateEntityComponent>,
  ) {}
  listLoading: boolean = false;
  loading: boolean = false;
  saveLoading: boolean = false;
  formFields: FormData[] = [];
  errorCode: number | null = null;
  errorMessage: string | null = null;
  form: FormGroup = this.fb.nonNullable.group({});
  resetSearchValue: EventEmitter<void> = new EventEmitter<void>();
  filteredFormFields: FormData[] = [];
  private searchValue: string = '';
  private filterValue: 'all' | 'filled' | 'empty' = 'all';
  private selectClosed: boolean = false;
  private startFieldsValue: FormData[] = [];
  private objectType: string = '';
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
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
  updateSearchValue(value: string) {
    this.searchValue = value.trim().toLowerCase();
    this.searchFormFields();
  }

  updateFilterValue(value: 'all' | 'filled' | 'empty') {
    this.filterValue = value;
    this.filterFormFields();
  }
  getFormData() {
    if (!this.data.class_name) {
      return;
    }
    this.errorCode = null;
    this.errorMessage = null;
    this.loading = true;
    this.navigatorService
      .getGraphClassAskAttributes(getCroppedName(this.data.class_name))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
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
  async createEntity() {
    const data = this.form.value;
    if (!data) {
      return;
    }
    this.saveLoading = true;
    const difference: PassportTemplateDifference = {};
    Object.keys(data).forEach((key: string) => {
      const selectedField = this.startFieldsValue.find((field) => field.predicate.includes(key));
      if (!selectedField) {
        return;
      }
      difference[key] = {
        currentValue: data[key],
        oldValue: selectedField.value,
        predicate: selectedField.predicate,
        isReference: selectedField.isReference,
      };
    });
    const id = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
    const diff: string = this.generateDiffService.generateDiff(difference, id, this.objectType, 'create');
    this.saveLoading = true;
    const res = await this.diffService.saveDiff(diff);

    res
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response) {
          this.notificationsService.displayMessage('Ошибка', 'Ошибка создания', 'error');
          return;
        }
        if (response.error) {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка создания';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
          return;
        }
        if (!response.result.data.length) {
          this.dialogRef.close(true);
          return;
        }

        const key = Object.keys(data).find((key) => key.includes('IdentifiedObject.name'));
        let name = 'Создание объекта';
        if (key) {
          name = data[key];
        }
        const computedDiff: DiffItem = {
          diff_id: response.result.data[0].id,
          diff_name: response.result.data[0].object_name,
          place_name: name,
        };
        this.diffService.insertIntoDiffList(computedDiff);
        this.dialogRef.close(true);
      });
  }
  private searchFormFields() {
    if (this.searchValue) {
      this.filteredFormFields = this.formFields.filter((item) => item.label.toLowerCase().includes(this.searchValue));
    } else {
      this.filteredFormFields = structuredClone(this.formFields);
    }
    this.filterFormFields();
  }
  private calculateFormGroup(data: GetClassAskDataRes) {
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
        value: this.getFieldValue(link.multiplicity),
        data: link.data,
        predicate: link.predicate,
        library: link.library,
        type,
        isReference: true,
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
    this.resetSearchValue.emit();
    this.filterFormFields();
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
  private getFieldValue(multiplicity: string): string[] | string {
    if (['0..*', '1..*'].includes(multiplicity)) {
      return [];
    }
    return '';
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
  ngOnInit() {
    this.getFormData();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
