import { CommonModule } from '@angular/common';
import { Component, forwardRef } from '@angular/core';
import { materialModules } from '@shared/materials';
import { UploadDataService } from './services/upload-data.service';
import { ClassType, ClassTypeAttr } from '@api-calls/services/http-class-type-service/models';
import {
  ApiResolverComponent,
  BreadcrumbsComponent,
  ClearFieldButtonDirective,
  FileSelectControlComponent,
  MatErrorExtComponent,
} from '@shared/components';
import { BehaviorSubject, finalize, ReplaySubject, takeUntil } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { fileExtensionValidator, noWhiteSpaceValidator } from '@shared/validators';
import { ButtonLoadingDirective } from '@shared/directives';
import { AddSyncAttrsReq } from '@api-calls/services/http-synchronization-service/models';
import { NotificationsService } from '@services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { Integration, IntegrationClassType } from '@api-calls/services/http-integrations-service/models';

interface SyncAttrsForm {
  classType: FormControl<ClassType | null>;
  integration: FormControl<Integration | null>;
  update_attribute_id: FormControl<number | null>;
  file: FormControl<FileList | null>;
}

@Component({
  selector: 'app-upload-data',
  standalone: true,
  imports: [
    CommonModule,
    ApiResolverComponent,
    ClearFieldButtonDirective,
    BreadcrumbsComponent,
    ButtonLoadingDirective,
    FileSelectControlComponent,
    forwardRef(() => MatErrorExtComponent),
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matChipsModule,
    materialModules.matFormFieldModule,
    materialModules.reactiveFormsModule,
    materialModules.matSelectModule,
    materialModules.matOptionModule,
  ],
  providers: [UploadDataService],
  templateUrl: './upload-data.component.html',
  styleUrl: './upload-data.component.scss',
})
export class UploadDataComponent {
  loading: boolean = false;
  saveLoading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  classTypesList: IntegrationClassType[] = [];
  integrationList: Integration[] = [];
  mode: 'add' | 'edit' = 'add';
  attrList$: BehaviorSubject<ClassTypeAttr[]> = new BehaviorSubject<ClassTypeAttr[]>([]);

  form: FormGroup<SyncAttrsForm> = this.fb.group<SyncAttrsForm>({
    integration: this.fb.control<Integration | null>(null, {
      validators: [Validators.required, noWhiteSpaceValidator()],
    }),
    classType: this.fb.control<ClassType | null>(null, {
      validators: [Validators.required, noWhiteSpaceValidator()],
    }),
    update_attribute_id: this.fb.control<number | null>(null, {
      nonNullable: false,
    }),
    file: this.fb.control<FileList | null>(null, {
      validators: [Validators.required, fileExtensionValidator(['xlsx'])],
    }),
  });
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private uploadDataService: UploadDataService,
    private fb: FormBuilder,
    private notificationsService: NotificationsService,
  ) {}
  getIntegrationList() {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.uploadDataService
      .getIntegrationList()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
        } else {
          this.integrationList = response.result.data;
        }
      });
  }
  getClassTypeList(integration_id: number) {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.uploadDataService
      .getIntegrationClassList(integration_id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
        } else {
          this.classTypesList = response.result.data;
        }
      });
  }
  uploadData() {
    const value = this.form.value;
    if (!value.file?.length) {
      return;
    }
    this.saveLoading = true;
    this.readFileAsBlob(value.file[0])
      .then((data) => {
        if (!value.classType?.id) {
          this.saveLoading = false;
          return;
        }
        if (this.mode === 'add') {
          const req: AddSyncAttrsReq = {
            class_type_id: value.classType.id,
            base64bytes: data,
          };
          this.uploadDataService
            .uploadFile(req)
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => (this.saveLoading = false)),
            )
            .subscribe((response) => {
              if (response.error) {
                const message = getErrorsMessage(response.error) || 'Ошибка загрузки';
                this.notificationsService.displayMessage('Ошибка', message, 'error');
              } else {
                const message = `Успешно добавлено ${response.result.added_row_num}  записи(ей)`;
                this.notificationsService.displayMessage('Успех', message, 'success', 3000);
              }
            });
          return;
        }
        if (!value.update_attribute_id) {
          return;
        }
        const req: AddSyncAttrsReq = {
          class_type_id: value.classType.id,
          base64bytes: data,
          update_attribute_id: value.update_attribute_id,
        };
        this.uploadDataService
          .uploadFile(req)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => (this.saveLoading = false)),
          )
          .subscribe((response) => {
            if (response.error) {
              const message = getErrorsMessage(response.error) || 'Ошибка загрузки';
              this.notificationsService.displayMessage('Ошибка', message, 'error');
            } else {
              const message = `Успешно обновлено ${response.result.updated_row_num} записи(ей)`;
              this.notificationsService.displayMessage('Успех', message, 'success', 3000);
            }
          });
      })
      .catch(() => {
        this.saveLoading = false;
        this.notificationsService.displayMessage('Ошибка', 'Ошибка парсинга файла', 'error');
      });
  }
  changeMode(mode: 'add' | 'edit') {
    this.mode = mode;
    if (this.mode === 'edit') {
      this.form.get('update_attribute_id')?.addValidators(Validators.required);
    } else {
      this.form.get('update_attribute_id')?.removeValidators(Validators.required);
      this.form.get('update_attribute_id')?.setErrors(null);
    }
    this.form.updateValueAndValidity();
  }
  private readFileAsBlob(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        if (!ev.target?.result) {
          reject();
          return;
        }
        resolve(ev.target.result.toString());
      };
    });
  }
  private getAttrList() {
    const classType = this.form.get('classType')?.value;
    if (!classType) {
      return;
    }
    this.uploadDataService
      .getAttrList(classType.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (response.error) {
          this.attrList$.next([]);
        } else {
          this.attrList$.next(response.result.data);
        }
      });
  }
  ngOnInit() {
    this.getIntegrationList();
    this.form
      .get('integration')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const integration_id: number | undefined = this.form.get('integration')?.value?.id;
        if (!integration_id) {
          return;
        }
        this.getClassTypeList(integration_id);
      });
    this.form
      .get('classType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getAttrList();
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
