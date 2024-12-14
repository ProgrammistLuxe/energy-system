import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { mapBackendErrors } from '@core/utils/map-api-error';
import { ReferencesService } from '@pages/architect/references/services/references.service';
import { NotificationsService } from '@services';
import { MatErrorExtComponent } from '@shared/components';
import { ButtonLoadingDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';
import { ReplaySubject, BehaviorSubject, takeUntil, finalize } from 'rxjs';

interface PrefixForm {
  full_name: FormControl<string>;
  short_name: FormControl<string>;
  description: FormControl<string | null>;
}
@Component({
  selector: 'app-create-prefix',
  providers: [ReferencesService],
  imports: [
    CommonModule,
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matButtonModule,
    materialModules.matInputModule,
    materialModules.matSelectModule,
    materialModules.matDialogModule,
    materialModules.matCheckBoxModule,
    MatErrorExtComponent,
    ButtonLoadingDirective,
  ],
  templateUrl: './create-prefix.component.html',
  styleUrl: './create-prefix.component.scss',
})
export class CreatePrefixComponent {
  constructor(
    private dialogRef: MatDialogRef<CreatePrefixComponent>,
    private notificationsService: NotificationsService,
    private referencesService: ReferencesService,
  ) {}
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  saveLoading: boolean = false;
  form = new FormGroup<PrefixForm>({
    short_name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    full_name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string | null>(null, { nonNullable: false }),
  });

  createPrefix() {
    this.saveLoading = true;
    const value = this.form.getRawValue();
    this.referencesService
      .createPrefix(value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Префикс успешно добавлен', 'success', 3000);
          this.dialogRef.close(true);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка добавления префикса';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
          mapBackendErrors(response.error, this.form);
        }
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
