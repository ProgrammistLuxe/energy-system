import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatErrorExtComponent, materialModules } from '@shared/index';
import { noWhiteSpaceValidator } from '@shared/validators';
import { ReplaySubject, takeUntil } from 'rxjs';
import { RoleGroupsService } from '../../services/role-groups.service';
import { NotificationsService } from '@services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';

@Component({
  selector: 'app-add-group',
  imports: [
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    MatErrorExtComponent,
  ],
  templateUrl: './add-group.component.html',
  styleUrl: './add-group.component.scss',
})
export class AddGroupComponent {
  constructor(
    private dialogRef: MatDialogRef<AddGroupComponent>,
    private roleGroupsService: RoleGroupsService,
    private notificationsService: NotificationsService,
  ) {}
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  nameControl: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required, noWhiteSpaceValidator()],
    nonNullable: true,
  });

  addGroup() {
    const name = this.nameControl.value;
    this.roleGroupsService
      .postAuthGroups({ name, permissions: [], user_set: [] })
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Группа успешно добавлена', 'success', 3000);
          this.dialogRef.close(true);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка добавления группы';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
