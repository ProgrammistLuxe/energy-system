import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReferencesClass } from '@api-calls/services/http-references/models/class';
import { ReferencePrefix } from '@api-calls/services/http-references/models/get-prefix-res.model';
import { getCroppedName } from '@core/utils/cut-prefix';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { mapBackendErrors } from '@core/utils/map-api-error';
import { ReferencesService } from '@pages/architect/references/services/references.service';
import { NotificationsService } from '@services';
import { ButtonLoadingDirective } from '@shared/directives';
import { MatErrorExtComponent } from '@shared/index';
import { materialModules } from '@shared/materials';
import { ReplaySubject, BehaviorSubject, takeUntil, finalize } from 'rxjs';

interface ClassForm {
  description: FormControl<string>;
  class_name: FormControl<string>;
  parent: FormControl<number | null>;
  explanation: FormControl<string | null>;
  class_prefix: FormControl<number>;
  is_library: FormControl<boolean>;
}

@Component({
  selector: 'app-edit-class',
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
  templateUrl: './edit-class.component.html',
  styleUrl: './edit-class.component.scss',
})
export class EditClassComponent {
  constructor(
    private dialogRef: MatDialogRef<EditClassComponent>,
    private notificationsService: NotificationsService,
    private referencesService: ReferencesService,
    @Inject(MAT_DIALOG_DATA) private editItem: ReferencesClass,
  ) {}
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  classList$: BehaviorSubject<ReferencesClass[]> = new BehaviorSubject<ReferencesClass[]>([]);
  prefixList$: BehaviorSubject<ReferencePrefix[]> = new BehaviorSubject<ReferencePrefix[]>([]);
  saveLoading: boolean = false;
  form = new FormGroup<ClassForm>({
    class_name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    is_library: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    class_prefix: new FormControl<number>(-1, { nonNullable: true, validators: [Validators.required] }),
    explanation: new FormControl<string | null>(null, { nonNullable: false }),
    parent: new FormControl<number | null>(null, { nonNullable: false }),
  });

  editClass() {
    this.saveLoading = true;
    const value = this.form.getRawValue();
    this.referencesService
      .editClass({ id: this.editItem.id, ...value })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Класс успешно обновлен', 'success', 3000);
          this.dialogRef.close(true);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка обновления класса';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
          mapBackendErrors(response.error, this.form);
        }
      });
  }
  ngOnInit() {
    this.referencesService
      .getClassList()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res.error) {
          this.classList$.next(res.result);
        }
      });
    this.referencesService
      .getPrefixList()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res.error) {
          this.prefixList$.next(res.result);
        }
      });
    this.form.setValue({
      class_name: getCroppedName(this.editItem.class_name),
      description: this.editItem.description,
      explanation: this.editItem.explanation,
      parent: this.editItem.parent?.id || null,
      is_library: this.editItem.is_library,
      class_prefix: this.editItem.prefix,
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
