import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';
import { noWhiteSpaceValidator } from '@shared/validators';
import { ReplaySubject, takeUntil } from 'rxjs';
import { RoleGroupsService } from '../../services/role-groups.service';
import { MatErrorExtComponent, materialModules } from '@shared/index';
import { GetUserGroup } from '@api-calls/services/http-role-group-service/models/get-user-group';

@Component({
  selector: 'app-edit-group',
  imports: [
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    MatErrorExtComponent,
  ],
  templateUrl: './edit-group.component.html',
  styleUrl: './edit-group.component.scss',
})
export class EditGroupComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { group: GetUserGroup },
    private dialogRef: MatDialogRef<EditGroupComponent>,
    private roleGroupsService: RoleGroupsService,
    private notificationsService: NotificationsService,
  ) {}
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  nameControl: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required, noWhiteSpaceValidator()],
    nonNullable: true,
  });

  editGroup() {
    const name = this.nameControl.value;
    let users: number[] = [];
    let permissions: number[] = [];
    if (this.roleGroupsService.currentGroupId === this.data.group.id) {
      users = this.roleGroupsService.selectedUsers$.value;
      permissions = this.roleGroupsService.selectedPermissions$.value;
    } else {
      users = this.data.group.user_set;
      permissions = this.data.group.permissions;
    }
    this.roleGroupsService
      .putAuthGroupsById(this.data.group.id, {
        name,
        permissions,
        user_set: users,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Группа успешно обновлена', 'success', 3000);
          this.dialogRef.close(true);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка обновления группы';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  ngOnInit() {
    this.nameControl.setValue(this.data.group.name);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
