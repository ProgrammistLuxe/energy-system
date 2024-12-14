import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  WorkAreaSidePanelComponent,
  SearchFieldComponent,
  EmptyTemplateComponent,
  materialModules,
  AddButtonDirective,
  DeleteConfirmDialogTemplateComponent,
  MatIconButtonCustomDirective,
  OverFlowTooltipDirective,
  ApiResolverComponent,
} from '@shared/index';
import { AddGroupComponent } from './components/add-group/add-group.component';
import { DialogService } from '@shared/services';
import { ReplaySubject, filter, finalize, takeUntil } from 'rxjs';
import { RoleGroupsService } from './services/role-groups.service';
import { GetUserGroup } from '@api-calls/services/http-role-group-service/models/get-user-group';
import { NotificationsService } from '@services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { EditGroupComponent } from './components/edit-group/edit-group.component';

@Component({
  selector: 'app-role-groups',
  imports: [
    CommonModule,
    WorkAreaSidePanelComponent,
    SearchFieldComponent,
    AddButtonDirective,
    OverFlowTooltipDirective,
    MatIconButtonCustomDirective,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    materialModules.matMenuModule,
    materialModules.matButtonModule,
    EmptyTemplateComponent,
    ApiResolverComponent,
    RouterModule,
  ],
  templateUrl: './role-groups.component.html',
  styleUrl: './role-groups.component.scss',
})
export class RoleGroupsComponent {
  roleGroupList: GetUserGroup[] = [];
  searchedRoleGroupList: GetUserGroup[] = [];
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  private searchValue: string = '';
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private dialogService: DialogService,
    private roleGroupService: RoleGroupsService,
    private notificationsService: NotificationsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}
  onSearchValueChanged(value: string) {
    this.searchValue = value.trim().toLowerCase();
    this.searchGroups();
  }

  addGroup() {
    const dialogRef = this.dialogService.open<AddGroupComponent>(AddGroupComponent, {
      title: 'Добавить группу',
      width: '480px',
      autoFocus: false,
    });
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.getAuthGroups();
      });
  }
  deleteGroup(group: GetUserGroup) {
    const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
      DeleteConfirmDialogTemplateComponent,
      {
        title: 'Удалить группу прав',
        data: `Вы уверены хотите удалить группу прав, "${group.name}"?`,
      },
    );
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.roleGroupService
          .deleteAuthGroupsById(group.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (!!response.error) {
              const errorMessage = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
              return;
            }
            this.notificationsService.displayMessage('Успешно', 'Группа успешно удалена', 'success', 3000);
            if (group.id === this.roleGroupService.currentGroupId) {
              this.roleGroupService.currentGroupId = null;
              this.router.navigate(['./'], { relativeTo: this.route });
            }
            this.getAuthGroups();
          });
      });
  }
  editGroup(group: GetUserGroup) {
    const dialogRef = this.dialogService.open<EditGroupComponent>(EditGroupComponent, {
      title: 'Редактировать группу прав',
      width: '480px',
      data: { group },
    });
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.getAuthGroups();
      });
  }
  copyGroup(group: GetUserGroup) {
    const name = group.name + ' (копия)';
    let users: number[] = [];
    let permissions: number[] = [];
    if (this.roleGroupService.currentGroupId === group.id) {
      users = this.roleGroupService.selectedUsers$.value;
      permissions = this.roleGroupService.selectedPermissions$.value;
    } else {
      users = group.user_set;
      permissions = group.permissions;
    }
    this.roleGroupService
      .postAuthGroups({ name, permissions: permissions, user_set: users })
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успешно', 'Группа успешно скопирована', 'success', 3000);
          this.getAuthGroups();
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка копирования';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  getAuthGroups() {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.roleGroupService
      .getAuthGroups()
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.roleGroupList = response.result;
          this.roleGroupService.groupList$.next(this.roleGroupList);
          this.searchGroups();
        } else {
          this.errorCode = +response;
          this.errorMessage = String(response);
        }
      });
  }
  private searchGroups() {
    if (!this.searchValue) {
      this.searchedRoleGroupList = structuredClone(this.roleGroupList);
    } else {
      this.searchedRoleGroupList = this.roleGroupList.filter((group) =>
        group.name.toLowerCase().includes(this.searchValue),
      );
    }
  }

  ngOnInit() {
    this.getAuthGroups();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
