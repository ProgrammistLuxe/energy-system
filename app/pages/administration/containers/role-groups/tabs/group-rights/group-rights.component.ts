import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  ButtonLoadingDirective,
  CheckScrollDirective,
  DisplayListDirective,
  FooterComponent,
  ListItemAddComponent,
  ListItemRemoveComponent,
  LoadingComponent,
  SearchFieldComponent,
  materialModules,
} from '@shared/index';
import { RoleGroupsService } from '../../services/role-groups.service';
import { ReplaySubject, finalize, forkJoin, takeUntil } from 'rxjs';
import { NotificationsService } from '@services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { Permission } from '@api-calls/services/http-permissions-service/models/permission';
import { GetUserGroup } from '@api-calls/services/http-role-group-service/models/get-user-group';

@Component({
  selector: 'app-group-Permissions',
  imports: [
    CommonModule,
    FooterComponent,
    SearchFieldComponent,
    ListItemRemoveComponent,
    ListItemAddComponent,
    LoadingComponent,
    ButtonLoadingDirective,
    CheckScrollDirective,
    DisplayListDirective,
    materialModules.matIconModule,
    materialModules.matButtonModule,
    materialModules.matDividerModule,
  ],
  templateUrl: './group-rights.component.html',
  styleUrl: './group-rights.component.scss',
})
export class GroupRightsComponent {
  loading: boolean = false;
  saveLoading: boolean = false;
  filteredAllPermissions: Permission[] = [];
  selectedPermissions: Permission[] = [];
  private searchValue: string = '';
  private groupSelectedPermissions: Permission[] = [];
  private currentGroup: GetUserGroup | null = null;
  private allPermissions: Permission[] = [];
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private roleGroupService: RoleGroupsService,
    private notificationsService: NotificationsService,
  ) {}
  onSearchPermissionsValueChanged(value: string) {
    this.searchValue = value.trim().toLowerCase();
    this.searchPermissions();
  }
  selectPermission(right: Permission) {
    this.filteredAllPermissions = this.filteredAllPermissions.filter((item) => item.id !== right.id);
    this.allPermissions = this.allPermissions.filter((item) => item.id !== right.id);
    this.selectedPermissions = this.selectedPermissions.concat([right]);
    const pemissions = this.selectedPermissions.map((permission) => permission.id);
    this.roleGroupService.selectedPermissions$.next(pemissions);
  }
  unSelectPermission(right: Permission) {
    this.selectedPermissions = this.selectedPermissions.filter((item) => item.id !== right.id);
    const pemissions = this.selectedPermissions.map((permission) => permission.id);
    this.roleGroupService.selectedPermissions$.next(pemissions);
    this.allPermissions = this.allPermissions.concat([right]);
    this.filteredAllPermissions = this.filteredAllPermissions.concat([right]);
  }

  saveData() {
    const id = this.roleGroupService.currentGroupId;
    if (!id || !this.currentGroup) {
      return;
    }
    this.saveLoading = true;
    const permissionList = this.selectedPermissions.map((permission) => permission.id);
    this.roleGroupService
      .putAuthGroupsById(id, {
        name: this.currentGroup.name,
        permissions: permissionList,
        user_set: this.currentGroup.user_set,
      })
      .pipe(
        finalize(() => (this.saveLoading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.notificationsService.displayMessage('Успех', 'Успешно обновлено', 'success', 3000);
          this.groupSelectedPermissions = structuredClone(this.selectedPermissions);
        } else {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка обновления';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }

  getData() {
    const id = this.roleGroupService.currentGroupId;
    if (!id) {
      return;
    }
    this.loading = true;
    forkJoin([this.roleGroupService.getAuthGroupsById(id), this.roleGroupService.getAuthPermissions()])
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe(([res1, res2]) => {
        if (!res1.error && !res2.error) {
          this.currentGroup = res1.result;
          this.selectedPermissions = this.getSelectedPermissions(res2.result, res1.result.permissions);
          this.groupSelectedPermissions = structuredClone(this.selectedPermissions);
          const pemissions = this.groupSelectedPermissions.map((permission) => permission.id);
          this.roleGroupService.selectedPermissions$.next(pemissions);
          const selectedIdList: number[] = this.selectedPermissions.map((permission) => permission.id);
          this.allPermissions = res2.result.filter((permission) => !selectedIdList.includes(permission.id));
          this.searchPermissions();
        }
      });
  }
  private searchPermissions() {
    if (!this.searchValue) {
      this.filteredAllPermissions = structuredClone(this.allPermissions);
    } else {
      this.filteredAllPermissions = this.allPermissions.filter((right) =>
        right.name.toLowerCase().includes(this.searchValue),
      );
    }
  }
  private getSelectedPermissions(permissionList: Permission[], idList: number[]): Permission[] {
    return permissionList.filter((permission) => idList.includes(permission.id));
  }
  ngOnInit() {
    this.roleGroupService.currentGroupId$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (value !== null) {
        this.getData();
      }
    });
  }
  ngOnDestroy() {
    const pemissions = this.groupSelectedPermissions.map((permission) => permission.id);
    this.roleGroupService.selectedPermissions$.next(pemissions);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
