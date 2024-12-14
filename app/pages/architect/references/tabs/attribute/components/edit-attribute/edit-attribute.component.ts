import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReferencesAttribute } from '@api-calls/services/http-references/models/attribute';
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

interface AttrForm {
  description: FormControl<string>;
  name: FormControl<string>;
  attributes_class: FormControl<number>;
  type: FormControl<string>;
  explanation: FormControl<string | null>;
  attribute_prefix: FormControl<number>;
}
@Component({
  selector: 'app-edit-attribute',
  providers: [ReferencesService],
  imports: [
    CommonModule,
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matButtonModule,
    materialModules.matInputModule,
    materialModules.matSelectModule,
    materialModules.matDialogModule,
    MatErrorExtComponent,
    ButtonLoadingDirective,
  ],
  templateUrl: './edit-attribute.component.html',
  styleUrl: './edit-attribute.component.scss',
})
export class EditAttributeComponent {
  constructor(
    private dialogRef: MatDialogRef<EditAttributeComponent>,
    private notificationsService: NotificationsService,
    private referencesService: ReferencesService,
    @Inject(MAT_DIALOG_DATA) private editItem: ReferencesAttribute,
  ) {}
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  attrTypes$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  prefixList$: BehaviorSubject<ReferencePrefix[]> = new BehaviorSubject<ReferencePrefix[]>([]);
  classList$: BehaviorSubject<ReferencesClass[]> = new BehaviorSubject<ReferencesClass[]>([]);
  saveLoading: boolean = false;
  form = new FormGroup<AttrForm>({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    explanation: new FormControl<string | null>(null, { nonNullable: false }),
    attributes_class: new FormControl<number>(-1, { nonNullable: true, validators: [Validators.required] }),
    attribute_prefix: new FormControl<number>(-1, { nonNullable: true, validators: [Validators.required] }),
  });

  editAttr() {
    this.saveLoading = true;
    const value = this.form.getRawValue();
    this.referencesService
      .editAttribute({ id: this.editItem.id, ...value })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Атрибут успешно обновлен', 'success', 3000);
          this.dialogRef.close(true);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка обновления атрибута';
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
    this.referencesService
      .getAvalilableAttrTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res.error) {
          this.attrTypes$.next(res.result.attribute_type);
        }
      });
    this.form.setValue({
      name: getCroppedName(this.editItem.name),
      description: this.editItem.description,
      explanation: this.editItem.explanation,
      type: this.editItem.type,
      attributes_class: this.editItem.attributes_class.id,
      attribute_prefix: this.editItem.attribute_prefix,
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
