import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { materialModules } from '@shared/index';
import { User } from '@api-calls/services/http-user-service/models/user.model';
import { HttpUserService } from '@api-calls/services';
import { ReplaySubject, takeUntil } from 'rxjs';
import { UserDataService } from '../../services/user.service';

@Component({
  selector: 'app-edit-employee-tabs',
  imports: [CommonModule, materialModules.matTabsModule, materialModules.matBadgeModule, RouterModule],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class EditEmployeeTabsComponent {
  user$ = this.userDataService.user$;

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private userDataService: UserDataService,
    private httpUserService: HttpUserService,
  ) {}

  ngOnInit() {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params['id'];
      if (Number.isInteger(+id)) {
        this.httpUserService
          .getAuthUsersById(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (res.result) {
              this.userDataService.user = res.result;
            }
          });
      } else {
        this.userDataService.user = null;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
