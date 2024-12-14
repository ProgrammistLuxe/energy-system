import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ReferencesClass } from '@api-calls/services/http-references/models/class';
import { ReferencePrefix } from '@api-calls/services/http-references/models/get-prefix-res.model';
import { multiplicity } from '@core/consts/associations-multiplicity';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { mapBackendErrors } from '@core/utils/map-api-error';
import { ReferencesService } from '@pages/architect/references/services/references.service';
import { NotificationsService } from '@services';
import { ButtonLoadingDirective } from '@shared/directives';
import { MatErrorExtComponent } from '@shared/index';
import { materialModules } from '@shared/materials';
import { ReplaySubject, BehaviorSubject, takeUntil, finalize } from 'rxjs';

interface AssociationForm {
  description: FormControl<string>;
  name: FormControl<string>;
  final_class: FormControl<number>;
  initial_class: FormControl<number>;
  explanation: FormControl<string | null>;
  multiplicity: FormControl<string>;
  association_prefix: FormControl<number>;
}

@Component({
  selector: 'app-create-association',
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
  templateUrl: './create-association.component.html',
  styleUrl: './create-association.component.scss',
})
export class CreateAssociationComponent {
  constructor(
    private dialogRef: MatDialogRef<CreateAssociationComponent>,
    private notificationsService: NotificationsService,
    private referencesService: ReferencesService,
  ) {}
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  classList$: BehaviorSubject<ReferencesClass[]> = new BehaviorSubject<ReferencesClass[]>([]);
  prefixList$: BehaviorSubject<ReferencePrefix[]> = new BehaviorSubject<ReferencePrefix[]>([]);
  saveLoading: boolean = false;
  form = new FormGroup<AssociationForm>({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    multiplicity: new FormControl<string>(multiplicity['0..* (любое количество)'], {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    initial_class: new FormControl<number>(-1, { nonNullable: true, validators: [Validators.required] }),
    explanation: new FormControl<string | null>(null, { nonNullable: false }),
    final_class: new FormControl<number>(-1, { nonNullable: true, validators: [Validators.required] }),
    association_prefix: new FormControl<number>(-1, { nonNullable: true, validators: [Validators.required] }),
  });
  get multiplicityOptions() {
    return Object.keys(multiplicity);
  }
  get multiplicity() {
    return multiplicity;
  }
  createAssociation() {
    this.saveLoading = true;
    const value = this.form.getRawValue();
    this.referencesService
      .createAssociation(value)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Ассоциация успешно добавлена', 'success', 3000);
          this.dialogRef.close(true);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка добавления ассоциации';
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
