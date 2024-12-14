import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { UserStateService } from '@core/services/user-state.service';

@Injectable({ providedIn: 'root' })
export class CheckUrlGuardService {
  constructor(
    private router: Router,
    private userStateService: UserStateService,
  ) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.userStateService.userValue) {
      return false;
    }
    if (!next.data?.['access'] || !next.data?.['access'].length) {
      return true;
    }
    const hasPermission = this.userStateService.userValue.permissions.some((permission) =>
      next.data['access'].includes(permission),
    );
    if (hasPermission) {
      return true;
    }
    this.router.navigate(['/access-deny']).then();
    return false;
  }
}
