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
import { ReplaySubject, finalize, forkJoin, takeUntil } from 'rxjs';
import { RoleGroupsService } from '../../services/role-groups.service';
import { User } from '@api-calls/services/http-user-service/models/user.model';
import { NotificationsService } from '@services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';

@Component({
  selector: 'app-group-employees',
  imports: [
    CommonModule,
    FooterComponent,
    SearchFieldComponent,
    ListItemRemoveComponent,
    ListItemAddComponent,
    LoadingComponent,
    DisplayListDirective,
    ButtonLoadingDirective,
    CheckScrollDirective,
    materialModules.matIconModule,
    materialModules.matButtonModule,
    materialModules.matDividerModule,
  ],
  templateUrl: './group-employees.component.html',
  styleUrl: './group-employees.component.scss',
})
export class GroupEmployeesComponent {
  loading: boolean = false;
  saveLoading: boolean = false;
  filteredAllEmployees: User[] = [];
  selectedEmployees: User[] = [];
  private searchValue: string = '';
  private groupSelectedEmployees: User[] = [];
  private allEmployees: User[] = [];
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private roleGroupService: RoleGroupsService,
    private notificationsService: NotificationsService,
  ) {}
  selectEmployee(employee: User) {
    this.filteredAllEmployees = this.filteredAllEmployees.filter((item) => item.id !== employee.id);
    this.allEmployees = this.allEmployees.filter((item) => item.id !== employee.id);
    this.selectedEmployees = this.selectedEmployees.concat([employee]);
    const employees = this.selectedEmployees.map((employee) => employee.id);
    this.roleGroupService.selectedUsers$.next(employees);
  }
  unSelectEmployee(employee: User) {
    this.selectedEmployees = this.selectedEmployees.filter((item) => item.id !== employee.id);
    const employees = this.selectedEmployees.map((employee) => employee.id);
    this.roleGroupService.selectedUsers$.next(employees);
    this.allEmployees = this.allEmployees.concat([employee]);
    this.filteredAllEmployees = this.filteredAllEmployees.concat([employee]);
  }
  onSearchEmployeesValueChanged(value: string) {
    this.searchValue = value.trim().toLowerCase();
    this.searchEmployees();
  }

  saveData() {
    const id = this.roleGroupService.currentGroupId;
    if (!id) {
      return;
    }
    this.saveLoading = true;
    const userIdList = this.selectedEmployees.map((employee) => employee.id);
    this.roleGroupService
      .postAuthGroupsByIdSetUsers(id, userIdList)
      .pipe(
        finalize(() => (this.saveLoading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        if (!!response.error) {
          const errorMessage = getErrorsMessage(response.error) || 'Ошибка обновления';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        } else {
          this.notificationsService.displayMessage('Успех', 'Успешно обновлено', 'success', 3000);
          this.groupSelectedEmployees = structuredClone(this.selectedEmployees);
        }
      });
  }

  getData() {
    const id = this.roleGroupService.currentGroupId;
    if (!id) {
      return;
    }
    this.loading = true;
    forkJoin([this.roleGroupService.getAuthGroupsByIdGetUsers(id), this.roleGroupService.getAuthUsers()])
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe(([res1, res2]) => {
        if (!res1.error) {
          this.selectedEmployees = res1.result;
        }
        if (!res2.error) {
          const selectedIdList: number[] = this.selectedEmployees.map((employee) => employee.id);
          this.groupSelectedEmployees = structuredClone(this.selectedEmployees);
          const employees = this.groupSelectedEmployees.map((employee) => employee.id);
          this.roleGroupService.selectedUsers$.next(employees);
          this.allEmployees = res2.result.filter((employee) => !selectedIdList.includes(employee.id));
          this.searchEmployees();
        }
      });
  }
  private searchEmployees() {
    if (!this.searchValue) {
      this.filteredAllEmployees = structuredClone(this.allEmployees);
    } else {
      this.filteredAllEmployees = this.allEmployees.filter(
        (employee) =>
          employee.first_name?.toLowerCase().includes(this.searchValue) ||
          employee.last_name?.toLowerCase().includes(this.searchValue) ||
          employee.middle_name?.toLowerCase().includes(this.searchValue) ||
          employee.username.toLowerCase().includes(this.searchValue),
      );
    }
  }
  ngOnInit() {
    this.roleGroupService.currentGroupId$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (value !== null) {
        this.getData();
      }
    });
  }
  ngOnDestroy() {
    const employees = this.groupSelectedEmployees.map((employee) => employee.id);
    this.roleGroupService.selectedUsers$.next(employees);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
