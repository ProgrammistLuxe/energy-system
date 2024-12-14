import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { IntegrationService } from '../../services/integration.service';
import { NotificationsService } from '@services';
import { ReplaySubject, takeUntil, finalize } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { noWhiteSpaceValidator } from '@shared/validators';
import { IntegrationClassType } from '@api-calls/services/http-integrations-service/models';
import { MatErrorExtComponent } from '@shared/components';
import { ButtonLoadingDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';

interface ClassTypeForm {
  name: FormControl<string>;
  description: FormControl<string | null>;
}
@Component({
  selector: 'app-add-class-type',
  standalone: true,
  imports: [
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    MatErrorExtComponent,
    ButtonLoadingDirective,
  ],
  providers: [IntegrationService],
  templateUrl: './add-class-type.component.html',
  styleUrl: './add-class-type.component.scss',
})
export class AddClassTypeComponent {
  saveLoading: boolean = false;
  form: FormGroup<ClassTypeForm> = this.fb.group<ClassTypeForm>({
    name: this.fb.control<string>('', {
      validators: [Validators.required, noWhiteSpaceValidator()],
      nonNullable: true,
    }),
    description: this.fb.control<string | null>(null, { validators: [Validators.required, noWhiteSpaceValidator()] }),
  });
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private dialogRef: MatDialogRef<AddClassTypeComponent>,
    @Inject(MAT_DIALOG_DATA)
    protected data: {
      classType: IntegrationClassType | null;
      integration_id: number | undefined;
      mode: 'edit' | 'add';
    },
    private integrationsService: IntegrationService,
    private notificationsService: NotificationsService,
    private fb: FormBuilder,
  ) {}
  editClassType() {
    const value = this.form.getRawValue();
    if (!value.name || !this.data.integration_id) {
      return;
    }
    this.saveLoading = true;
    if (this.data.mode === 'add') {
      this.integrationsService
        .addClassType({ integration_id: this.data.integration_id, ...value })
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
            this.notificationsService.displayMessage('Успех', 'Успешно добавлено', 'success', 3000);
            this.dialogRef.close(this.data.integration_id);
          }
        });
      return;
    }
    if (this.data.mode === 'edit' && !!this.data.classType) {
      this.integrationsService
        .updateClassType({ integration_id: this.data.integration_id, class_type_id: this.data.classType.id, ...value })
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
            this.dialogRef.close(true);
          }
        });
      return;
    }
  }
  ngOnInit() {
    if (this.data.mode === 'edit' && this.data.classType) {
      this.form.setValue({ name: this.data.classType.name, description: this.data.classType.description });
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
