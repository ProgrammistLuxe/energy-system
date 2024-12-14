import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { MatErrorExtComponent, materialModules } from '@shared/index';
import { ReplaySubject, takeUntil } from 'rxjs';
import { PassportTemplatesService } from '../../services/passport-templates.service';
import { NotificationsService } from '@services';
import { FormControl, Validators } from '@angular/forms';
import { noWhiteSpaceValidator } from '@shared/validators';

@Component({
  selector: 'app-edit-folder',
  providers: [PassportTemplatesService],
  imports: [
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    MatErrorExtComponent,
  ],
  templateUrl: './edit-folder.component.html',
  styleUrl: './edit-folder.component.scss',
})
export class EditFolderComponent {
  titleControl: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required, noWhiteSpaceValidator(), Validators.maxLength(255)],
    nonNullable: true,
  });
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private passportTemplateService: PassportTemplatesService,
    private dialogRef: MatDialogRef<EditFolderComponent>,
    private notificationsService: NotificationsService,
    @Inject(MAT_DIALOG_DATA) private data: { id: number; parent: number; title: string },
  ) {}
  editFolder() {
    const title = this.titleControl.value;
    this.passportTemplateService
      .updateTreeFolder(this.data.id, { title, parent: this.data.parent })
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Папка успешно обновлена', 'success', 3000);
          this.dialogRef.close(true);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка обновления папки';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  ngOnInit() {
    this.titleControl.setValue(this.data.title);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
