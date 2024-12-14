import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { IntegrationService } from '../../services/integration.service';
import { NotificationsService } from '@services';
import { ButtonLoadingDirective, materialModules, MatErrorExtComponent, noWhiteSpaceValidator } from '@shared/index';
import { finalize, ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-add-integration',
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
  templateUrl: './add-integration.component.html',
  styleUrl: './add-integration.component.scss',
})
export class AddIntegrationComponent {
  nameControl: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required, noWhiteSpaceValidator()],
    nonNullable: true,
  });
  saveLoading: boolean = false;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private dialogRef: MatDialogRef<AddIntegrationComponent>,
    @Inject(MAT_DIALOG_DATA)
    protected data: { name: string | undefined; integration_id: number | undefined; mode: 'edit' | 'add' },
    private integrationsService: IntegrationService,
    private notificationsService: NotificationsService,
  ) {}
  editIntegration() {
    const name = this.nameControl.getRawValue();
    if (!name) {
      return;
    }
    this.saveLoading = true;
    if (this.data.mode === 'add') {
      this.integrationsService
        .addIntegration(name)
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
            this.dialogRef.close(name);
          }
        });
      return;
    }
    if (this.data.mode === 'edit' && this.data.integration_id) {
      this.integrationsService
        .updateIntegration(this.data.integration_id, name)
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
            this.dialogRef.close(name);
          }
        });
      return;
    }
  }
  ngOnInit() {
    if (this.data.mode === 'edit' && this.data.name) {
      this.nameControl.setValue(this.data.name);
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
