import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserMe } from '@api-calls/services/http-user-service/models/user-me.model';
import { UserAuthService } from '@core/services/user-auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { materialModules } from '@shared/index';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, materialModules.matMenuModule, materialModules.matIconModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  auth$ = this.userAuthService.isAuth$;

  user: UserMe | null = null;
  userNameCompiled: string = '';

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private userAuthService: UserAuthService,
    private userStateService: UserStateService,
  ) {}
  logOut() {
    this.userAuthService.logOut();
  }
  ngOnInit() {
    this.userStateService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        this.user = user;
        this.userNameCompiled += user.first_name ? user.first_name[0] + '. ' : '';
        this.userNameCompiled += user.middle_name ? user.middle_name[0] + '. ' : '';
        this.userNameCompiled += user.last_name ?? '';
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
