import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { ButtonLoadingDirective, materialModules, MatErrorExtComponent, noWhiteSpaceValidator } from '@shared/index';
import { IntegrationService } from '../../services/integration.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IntegrationParticipant } from '@api-calls/services/http-integrations-service/models';
import { NotificationsService } from '@services';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, finalize, ReplaySubject, takeUntil } from 'rxjs';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { GetTypeListRes } from '@api-calls/services/http-attributes-service/models';
import { ClassTypeAttr } from '@api-calls/services/http-class-type-service/models';
interface AttrForm {
  name: FormControl<string>;
  type: FormControl<string>;
}
@Component({
  selector: 'app-add-attrs-row',
  standalone: true,
  imports: [
    CommonModule,
    materialModules.reactiveFormsModule,
    materialModules.formsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    materialModules.matSelectModule,
    MatErrorExtComponent,
    ButtonLoadingDirective,
  ],
  providers: [IntegrationService],
  templateUrl: './add-attr.component.html',
  styleUrl: './add-attr.component.scss',
})
export class AddAttrsRowComponent {
  saveLoading: boolean = false;
  selectedParticipant: IntegrationParticipant | null = null;
  attrTypeList$: BehaviorSubject<GetTypeListRes> = new BehaviorSubject<GetTypeListRes>([]);
  form: FormGroup<AttrForm> = this.fb.group<AttrForm>({
    name: this.fb.control<string>('', {
      validators: [Validators.required, noWhiteSpaceValidator()],
      nonNullable: true,
    }),
    type: this.fb.control<string>('', {
      validators: [Validators.required, noWhiteSpaceValidator()],
      nonNullable: true,
    }),
  });
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private dialogRef: MatDialogRef<AddAttrsRowComponent>,
    @Inject(MAT_DIALOG_DATA)
    protected data: {
      participants: IntegrationParticipant[];
      class_id: number;
      mode: 'add' | 'edit';
      attr: ClassTypeAttr | undefined;
      selectedSystem: IntegrationParticipant | undefined;
    },
    private integrationsService: IntegrationService,
    private notificationsService: NotificationsService,
    private fb: FormBuilder,
  ) {}
  editAttr() {
    const value = this.form.getRawValue();
    if (!this.data.class_id || !this.selectedParticipant) {
      return;
    }
    this.saveLoading = true;
    if (this.data.mode === 'add') {
      this.integrationsService
        .addAttr({ class_id: this.data.class_id, participant_id: this.selectedParticipant.id, ...value })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.saveLoading = false)),
        )
        .subscribe((response) => {
          if (response.error) {
            const message = getErrorsMessage(response.error) || 'Ошибка создания';
            this.notificationsService.displayMessage('Ошибка', message, 'error');
            return;
          } else {
            this.notificationsService.displayMessage('Успех', 'Успешно создано', 'success', 3000);
            this.dialogRef.close(response.result.id);
          }
        });
    } else if (this.data.mode === 'edit' && !!this.data.attr) {
      this.integrationsService
        .updateAttr({
          attribute_id: this.data.attr.id,
          ...value,
        })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.saveLoading = false)),
        )
        .subscribe((response) => {
          if (response.error) {
            const message = getErrorsMessage(response.error) || 'Ошибка обновления';
            this.notificationsService.displayMessage('Ошибка', message, 'error');
            return;
          } else {
            this.notificationsService.displayMessage('Успех', 'Успешно обновлено', 'success', 3000);
            this.dialogRef.close(response.result);
          }
        });
    }
  }
  ngOnInit() {
    this.integrationsService
      .getAttrTypeList()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (response.error) {
          const message = getErrorsMessage(response.error) || 'Ошибка получения списка типов атрибута';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
        } else {
          this.attrTypeList$.next(response.result);
        }
      });
    if (this.data.mode === 'edit' && !!this.data.attr) {
      this.form.setValue({ type: this.data.attr.type, name: this.data.attr.name });
    }
    if (this.data.mode === 'edit' && !!this.data.selectedSystem) {
      this.selectedParticipant = this.data.selectedSystem;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
