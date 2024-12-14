import { Component } from '@angular/core';
import { DiffsService } from '../../services/diffs.service';
import { CommonModule } from '@angular/common';
import {
  ButtonLoadingDirective,
  ClearFieldButtonDirective,
  FileSelectControlComponent,
  MatErrorExtComponent,
  MatIconButtonCustomDirective,
  materialModules,
} from '@shared/index';
import { MatDialogRef } from '@angular/material/dialog';
import { NotificationsService } from '@services';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { FormControl, Validators } from '@angular/forms';
import { fileExtensionValidator } from '@shared/validators';

@Component({
  selector: 'app-add-diff-modal',
  imports: [
    CommonModule,
    materialModules.matButtonModule,
    materialModules.matDialogModule,
    materialModules.matInputModule,
    materialModules.matFormFieldModule,
    materialModules.reactiveFormsModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    FileSelectControlComponent,
    ClearFieldButtonDirective,
    ButtonLoadingDirective,
    MatErrorExtComponent,
  ],
  providers: [DiffsService],
  templateUrl: './add-diff-modal.component.html',
  styleUrl: './add-diff-modal.component.scss',
})
export class AddDiffModalComponent {
  saveLoading: boolean = false;
  descriptionControl: FormControl<string | null> = new FormControl<string | null>('');
  fileListControl: FormControl<FileList | null> = new FormControl<FileList | null>(null, [
    Validators.required,
    fileExtensionValidator(['xml']),
  ]);
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private diffService: DiffsService,
    private dialogRef: MatDialogRef<AddDiffModalComponent>,
    private notificationsService: NotificationsService,
  ) {}

  saveDiff() {
    if (this.fileListControl.invalid || !this.fileListControl.value) {
      return;
    }
    this.saveLoading = true;
    this.diffService
      .saveDiffWithFile(this.fileListControl.value, this.descriptionControl.value)
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
          return;
        }
        this.notificationsService.displayMessage('Успешно', 'Успешно сохранено', 'success', 3000);
        this.dialogRef.close(true);
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
