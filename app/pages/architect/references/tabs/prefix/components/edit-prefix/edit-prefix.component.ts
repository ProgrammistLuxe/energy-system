import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { ReferencesService } from '@pages/architect/references/services/references.service';
import { NotificationsService } from '@services';
import { ButtonLoadingDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';
import { ReplaySubject, BehaviorSubject, takeUntil, finalize } from 'rxjs';

import { ReferencePrefix } from '@api-calls/services/http-references/models/get-prefix-res.model';
import { MatErrorExtComponent } from '@shared/index';
import { mapBackendErrors } from '@core/utils/map-api-error';

interface PrefixForm {
  full_name: FormControl<string>;
  short_name: FormControl<string>;
  description: FormControl<string | null>;
}
@Component({
  selector: 'app-edit-prefix',
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
  templateUrl: './edit-prefix.component.html',
  styleUrl: './edit-prefix.component.scss',
})
export class EditPrefixComponent {
  constructor(
    private dialogRef: MatDialogRef<EditPrefixComponent>,
    private notificationsService: NotificationsService,
    private referencesService: ReferencesService,
    @Inject(MAT_DIALOG_DATA) private editItem: ReferencePrefix,
  ) {}
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  saveLoading: boolean = false;
  form = new FormGroup<PrefixForm>({
    short_name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    full_name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string | null>(null, { nonNullable: false }),
  });

  editPrefix() {
    this.saveLoading = true;
    const value = this.form.getRawValue();
    this.referencesService
      .editPrefix({ id: this.editItem.id, ...value })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Префикс успешно обновлен', 'success', 3000);
          this.dialogRef.close(true);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка обновления префикса';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
          mapBackendErrors(response.error, this.form);
        }
      });
  }
  ngOnInit() {
    this.form.setValue({
      short_name: this.editItem.short_name,
      description: this.editItem.description,
      full_name: this.editItem.full_name,
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
