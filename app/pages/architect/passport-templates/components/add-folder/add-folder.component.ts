import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { PassportTemplatesService } from '@pages/architect/passport-templates/services/passport-templates.service';
import { NotificationsService } from '@services';
import { MatErrorExtComponent, materialModules } from '@shared/index';
import { noWhiteSpaceValidator } from '@shared/validators';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-add-template',
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
  templateUrl: './add-folder.component.html',
  styleUrl: './add-folder.component.scss',
})
export class AddFolderComponent {
  titleControl: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required, noWhiteSpaceValidator(), Validators.maxLength(255)],
    nonNullable: true,
  });
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private passportTemplateService: PassportTemplatesService,
    private dialogRef: MatDialogRef<AddFolderComponent>,
    private notificationsService: NotificationsService,
    @Inject(MAT_DIALOG_DATA) private data: { parent: number; level: number },
  ) {}
  addFolder() {
    if (this.data.level > 1) {
      this.notificationsService.displayMessage(
        'Ошибка',
        'Нельзя создать папку, максимальный уровень вложенности 3',
        'error',
      );
      return;
    }
    const title = this.titleControl.value;
    this.passportTemplateService
      .createTreeFolder({ title, parent: this.data.parent || null })
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Папка успешно добавлена', 'success', 3000);
          this.dialogRef.close(true);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка добавления папки';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
