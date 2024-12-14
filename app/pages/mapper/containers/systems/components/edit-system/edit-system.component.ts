import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { SystemsService } from '../../services/systems.service';
import { NotificationsService } from '@services';
import { ButtonLoadingDirective, materialModules, MatErrorExtComponent } from '@shared/index';
import { noWhiteSpaceValidator } from '@shared/validators';
import { finalize, ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-edit-system',
  standalone: true,
  imports: [
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    MatErrorExtComponent,
    ButtonLoadingDirective,
  ],
  providers: [SystemsService],
  templateUrl: './edit-system.component.html',
  styleUrl: './edit-system.component.scss',
})
export class EditSystemComponent {
  saveLoading: boolean = false;
  nameControl: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required, noWhiteSpaceValidator()],
    nonNullable: true,
  });
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private dialogRef: MatDialogRef<EditSystemComponent>,
    @Inject(MAT_DIALOG_DATA)
    protected data: { name: string | undefined; participant_id: number | undefined; mode: 'edit' | 'add' },
    private systemsService: SystemsService,
    private notificationsService: NotificationsService,
  ) {}
  addSystem() {
    const name = this.nameControl.getRawValue();
    if (!name) {
      return;
    }
    this.saveLoading = true;
    if (this.data.mode === 'add') {
      this.systemsService
        .addSystem(name)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.saveLoading = false)),
        )
        .subscribe((response) => {
          if (response.error) {
            const message = getErrorsMessage(response.error) || 'Ошибка создания';
            this.notificationsService.displayMessage('Ошибка', message, 'error');
            return;
          } else {
            this.notificationsService.displayMessage('Успех', 'Успешно добавлено', 'success', 3000);
            this.dialogRef.close(name);
          }
        });
      return;
    }
    if (this.data.mode === 'edit' && this.data.participant_id) {
      this.systemsService
        .updateSystem({ name, participant_id: this.data.participant_id })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.saveLoading = false)),
        )
        .subscribe((response) => {
          if (response.error) {
            const message = getErrorsMessage(response.error) || 'Ошибка обновления';
            this.notificationsService.displayMessage('Ошибка', message, 'error');
            return;
          } else {
            this.notificationsService.displayMessage('Успех', 'Успешно обновлено', 'success', 3000);
            this.dialogRef.close(name);
          }
        });
      return;
    }
  }
  ngOnInit() {
    if (this.data.mode === 'edit' && this.data.name) {
      this.nameControl.setValue(this.data.name);
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
