import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { GenerateDiffService } from '../../services/generate-diff.service';
import { SchemasService } from '../../services/schemas.service';
import { AppConfigService, CompareDataService, NotificationsService } from '@services';
import {
  ButtonLoadingDirective,
  EmptyTemplateComponent,
  LoadingComponent,
  MatErrorExtComponent,
  materialModules,
} from '@shared/index';
import { BehaviorSubject, ReplaySubject, finalize, takeUntil } from 'rxjs';
import { Difference } from '../../models/difference.model';
import { mapBackendErrors } from '@core/utils/map-api-error';
import { DiffItem, DiffService } from '@features/active-diffs-table/services/diff.service';
import { PassportsTreeService } from '@features/passports-tree/services/passports-tree.service';
interface FormData {
  [key: string]: { value: any; label: string; type: string };
}

@Component({
  selector: 'app-element-data-dialog',
  providers: [GenerateDiffService, SchemasService],
  imports: [
    CommonModule,
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matDialogModule,
    ButtonLoadingDirective,
    EmptyTemplateComponent,
    LoadingComponent,
    MatErrorExtComponent,
  ],
  templateUrl: './element-data-dialog.component.html',
  styleUrl: './element-data-dialog.component.scss',
})
export class ElementDataDialogComponent {
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private schemaService: SchemasService,
    private generateDiffService: GenerateDiffService,
    private dialogRef: MatDialogRef<ElementDataDialogComponent>,
    private notificationsService: NotificationsService,
    private appConfigService: AppConfigService,
    private compareDataService: CompareDataService,
    private diffService: DiffService,
    private passportTreeService: PassportsTreeService,
    @Inject(MAT_DIALOG_DATA) private data: Record<string, any>,
  ) {}
  form: FormGroup = new FormGroup({});
  formData: FormData | null = null;
  loading: boolean = false;
  saveLoading: boolean = false;
  private uid: string = '';
  private class_name: string = '';
  private formData$: BehaviorSubject<any> = new BehaviorSubject<any>({});
  get controlList(): string[] {
    if (!this.formData) {
      return [];
    }
    return Object.keys(this.formData);
  }
  get isTheSame() {
    return this.compareDataService.isTheSame;
  }
  async saveDiff() {
    const data = this.form.value;
    const difference: Difference = {};
    Object.keys(data).forEach((key: string) => {
      if (!this.formData) {
        return;
      }
      if (JSON.stringify(data[key]) !== JSON.stringify(this.formData[key].value)) {
        difference[key] = {
          currentValue: data[key],
          oldValue: this.formData[key].value,
        };
      }
    });
    const diff: string = this.generateDiffService.generateDiff(difference, this.uid, this.class_name);
    this.saveLoading = true;
    const res = await this.schemaService.saveDiff(diff);
    res
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!response) {
          this.notificationsService.displayMessage('Ошибка', 'Ошибка сохранения', 'error');
          return;
        }
        if (response.error) {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка сохранения';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
          // mapBackendErrors(response.error, this.form);
          return;
        }
        this.notificationsService.displayMessage('Успешно', 'Успешно сохранено', 'success', 3000);
        if (!this.passportTreeService.currentNode || !response.result.data.length) {
          return;
        }
        const computedDiff: DiffItem = {
          diff_id: response.result.data[0].id,
          diff_name: response.result.data[0].object_name,
          schema_uid: this.passportTreeService.currentNode.id,
          place_name: this.passportTreeService.currentNode.title,
        };
        this.diffService.insertIntoDiffList(computedDiff);
        this.dialogRef.close(data['IdentifiedObject.name']);
      });
  }
  private fillForm() {
    if (!this.formData) {
      return;
    }
    Object.keys(this.formData).forEach((key) => {
      if (!this.formData) {
        return;
      }
      this.form.addControl(key, new FormControl(this.formData[key]['value'], Validators.required));
    });
    this.formData$.next(this.form.value);
    this.compareDataService.registerValues(this.form.value, this.formData$);
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.formData$.next(data);
    });
  }
  ngOnInit() {
    const id: string = this.data['attributes']['attrs']?.['rdf']?.['parentObjectId'];
    if (!id) {
      return;
    }
    this.uid = this.appConfigService.config['GRAPH_CONTEXT'] + '#' + id.split('#')[1];
    this.loading = true;
    this.schemaService
      .getNodeData(this.uid)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          const message = getErrorsMessage(response.error) || 'Ошибка получения данных';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
          return;
        }
        const properties = response.result.data.properties;
        Object.keys(properties).forEach((key) => {
          if (key.split('#').length > 1 && key.split('#')[1] === 'type') {
            this.class_name = properties[key][0]['value'].split('#')[1];
            return;
          }
          if (!Array.isArray(properties[key])) {
            return;
          }

          if (properties[key].length > 1) {
            return;
          }
          if (properties[key][0]?.['class_name'] !== null) {
            return;
          }

          if (!this.formData) {
            this.formData = {};
          }
          const className = key.split('#')[1];
          this.formData[className] = {
            value: properties[key][0]['value'],
            type: 'string',
            label: className,
          };
        });
        this.fillForm();
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
