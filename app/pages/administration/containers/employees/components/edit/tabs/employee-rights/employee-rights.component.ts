import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpUserService } from '@api-calls/services';
import { GetUserGroup } from '@api-calls/services/http-role-group-service/models/get-user-group';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { RoleGroupsService } from '@pages/administration/containers/role-groups/services/role-groups.service';
import { NotificationsService } from '@services';
import {
  ButtonLoadingDirective,
  FooterComponent,
  ListItemAddComponent,
  ListItemRemoveComponent,
  LoadingComponent,
  materialModules,
} from '@shared/index';
import { ReplaySubject, filter, finalize, takeUntil } from 'rxjs';
import { UserDataService } from '../../../services/user.service';
import { UpdateUser } from '@api-calls/services/http-user-service/models/user-update.model';

@Component({
  selector: 'app-edit-employee-rights',
  imports: [
    CommonModule,
    materialModules.matButtonModule,
    materialModules.matDividerModule,
    ListItemAddComponent,
    ListItemRemoveComponent,
    LoadingComponent,
    FooterComponent,
    ButtonLoadingDirective,
  ],
  templateUrl: './employee-rights.component.html',
  styleUrl: './employee-rights.component.scss',
})
export class EditEmployeeRightsComponent {
  loading: boolean = true;
  saveLoading = false;
  allRightsGroups: GetUserGroup[] = [];
  selectedRightsGroups: GetUserGroup[] = [];
  allRightsGroupsFiltered: GetUserGroup[] = [];

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private roleGroupService: RoleGroupsService,
    private notificationsService: NotificationsService,
    private userDataService: UserDataService,
    private httpUserService: HttpUserService,
  ) {}

  private sortRightsGroups() {
    this.selectedRightsGroups?.sort((a, b) => a.id - b.id);
    this.allRightsGroupsFiltered?.sort((a, b) => a.id - b.id);
  }

  addGroup(group: GetUserGroup) {
    this.selectedRightsGroups = this.selectedRightsGroups || [];
    const groupExists = this.selectedRightsGroups.some((el) => el.id === group.id);
    if (!groupExists) {
      this.selectedRightsGroups.push(group);
      const selectedIds = new Set(this.selectedRightsGroups.map((el) => el.id));
      this.allRightsGroupsFiltered = this.allRightsGroups.filter((el) => !selectedIds.has(el.id));
      this.sortRightsGroups();
    }
  }

  removeGroup(group: GetUserGroup) {
    this.selectedRightsGroups = this.selectedRightsGroups.filter((item) => item.id !== group.id) || [];
    this.allRightsGroupsFiltered.push(group);
    this.sortRightsGroups();
  }

  save() {
    if (!this.userDataService.userValue) {
      return;
    }
    this.saveLoading = true;
    const user: UpdateUser = {
      is_active: this.userDataService.userValue.is_active ?? true,
      id: this.userDataService.userValue.id,
      last_name: this.userDataService.userValue.last_name ?? null,
      first_name: this.userDataService.userValue.first_name ?? null,
      middle_name: this.userDataService.userValue.middle_name ?? null,
      phone: this.userDataService.userValue.phone ?? null,
      username: this.userDataService.userValue.username,
      job_title: this.userDataService.userValue.job_title ?? null,
      appointment: this.userDataService.userValue.appointment ?? null,
      groups: this.selectedRightsGroups.map((el) => el.id) ?? [],
    };
    this.httpUserService
      .putAuthUsersById(user)
      .pipe(
        finalize(() => (this.saveLoading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (!this.userDataService.userValue) {
          this.notificationsService.displayMessage('Ошибка', 'Ошибка сохранения', 'error');
          return;
        }
        if (!res.error) {
          this.notificationsService.displayMessage('Успешно', 'Данные пользователя успешно сохранены', 'success', 3000);
          this.httpUserService
            .getAuthUsersById(this.userDataService.userValue.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
              if (res.result) {
                this.userDataService.user = res.result;
              }
            });
        } else {
          const errorMessage = getErrorsMessage(res.error) || 'Ошибка сохранения';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }

  back() {
    this.router.navigate(['../../'], { queryParamsHandling: 'preserve', relativeTo: this.activatedRoute });
  }

  private getAuthGroups() {
    this.roleGroupService
      .getAuthGroups()
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.allRightsGroups = response.result;
          this.allRightsGroupsFiltered = this.allRightsGroups.filter(
            (el) => !this.selectedRightsGroups?.some((selectedGroup) => selectedGroup.id === el.id),
          );
          this.sortRightsGroups();
        }
      });
  }

  ngOnInit() {
    if (this.activatedRoute.snapshot.routeConfig?.path === 'employee-rights') {
      this.userDataService.user$
        .pipe(
          filter((res) => !!res),
          takeUntil(this.destroy$),
        )
        .subscribe((res) => {
          this.selectedRightsGroups = res?.groups ?? [];
          this.getAuthGroups();
          this.sortRightsGroups();
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
