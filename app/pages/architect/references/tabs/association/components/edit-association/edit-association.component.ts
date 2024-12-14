import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReferencesClass } from '@api-calls/services/http-references/models/class';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { ReferencesService } from '@pages/architect/references/services/references.service';
import { NotificationsService } from '@services';
import { ButtonLoadingDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';
import { ReplaySubject, BehaviorSubject, takeUntil, finalize } from 'rxjs';
import { ReferencesAssociation } from '@api-calls/services/http-references/models/associations';
import { ReferencePrefix } from '@api-calls/services/http-references/models/get-prefix-res.model';
import { MatErrorExtComponent } from '@shared/index';
import { mapBackendErrors } from '@core/utils/map-api-error';
import { getCroppedName } from '@core/utils/cut-prefix';
import { multiplicity } from '@core/consts/associations-multiplicity';

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
  selector: 'app-edit-association',
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
  templateUrl: './edit-association.component.html',
  styleUrl: './edit-association.component.scss',
})
export class EditAssociationComponent {
  constructor(
    private dialogRef: MatDialogRef<EditAssociationComponent>,
    private notificationsService: NotificationsService,
    private referencesService: ReferencesService,
    @Inject(MAT_DIALOG_DATA) private editItem: ReferencesAssociation,
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
  editAssociation() {
    this.saveLoading = true;
    const value = this.form.getRawValue();
    this.referencesService
      .editAssociation({ id: this.editItem.id, ...value })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Ассоциация успешно обновлена', 'success', 3000);
          this.dialogRef.close(true);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка обновления ассоциации';
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
      name: getCroppedName(this.editItem.name),
      description: this.editItem.description,
      explanation: this.editItem.explanation,
      final_class: this.editItem.final_class.id,
      initial_class: this.editItem.initial_class.id,
      multiplicity: this.editItem.multiplicity,
      association_prefix: this.editItem.association_prefix,
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
