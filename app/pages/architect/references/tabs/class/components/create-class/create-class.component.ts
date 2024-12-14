import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ReferencesClass } from '@api-calls/services/http-references/models/class';
import { ReferencePrefix } from '@api-calls/services/http-references/models/get-prefix-res.model';
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
  selector: 'app-create-class',
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
  templateUrl: './create-class.component.html',
  styleUrl: './create-class.component.scss',
})
export class CreateClassComponent {
  constructor(
    private dialogRef: MatDialogRef<CreateClassComponent>,
    private notificationsService: NotificationsService,
    private referencesService: ReferencesService,
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

  createClass() {
    this.saveLoading = true;
    const value = this.form.getRawValue();
    this.referencesService
      .createClass(value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Класс успешно добавлен', 'success', 3000);
          this.dialogRef.close(true);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка добавления класса';
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
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
