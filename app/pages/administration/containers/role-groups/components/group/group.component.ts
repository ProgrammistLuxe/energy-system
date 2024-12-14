import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { materialModules } from '@shared/index';
import { RoleGroupsService } from '../../services/role-groups.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-group',
  imports: [CommonModule, materialModules.matTabsModule, materialModules.matBadgeModule, RouterModule],
  templateUrl: './group.component.html',
  styleUrl: './group.component.scss',
})
export class GroupComponent {
  selectedPermissionsCount: number = 0;
  selectedUsersCount: number = 0;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private route: ActivatedRoute,
    protected roleGroupsService: RoleGroupsService,
  ) {}
  private initSubs() {
    this.roleGroupsService.groupList$
      .asObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe((groups) => {
        if (!this.roleGroupsService.currentGroupId) {
          return;
        }
        const currentGtoup = groups.find((group) => Number(this.roleGroupsService.currentGroupId) === group.id) ?? null;
        this.roleGroupsService.selectedPermissions$.next(currentGtoup?.permissions ?? []);
        this.roleGroupsService.selectedUsers$.next(currentGtoup?.user_set ?? []);
      });
    this.roleGroupsService.selectedUsers$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.selectedUsersCount = data.length;
    });
    this.roleGroupsService.selectedPermissions$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.selectedPermissionsCount = data.length;
    });
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((param) => {
      this.roleGroupsService.currentGroupId = Number(param['id']);
      this.setActiveCount();
    });
  }
  private setActiveCount() {
    const currentGtoup =
      this.roleGroupsService.groupList$.value.find(
        (group) => Number(this.roleGroupsService.currentGroupId) === group.id,
      ) ?? null;
    this.roleGroupsService.selectedPermissions$.next(currentGtoup?.permissions ?? []);
    this.roleGroupsService.selectedUsers$.next(currentGtoup?.user_set ?? []);
  }
  ngOnInit() {
    this.initSubs();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
