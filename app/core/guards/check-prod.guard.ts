import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AppConfigService } from '@services';

@Injectable({
  providedIn: 'root',
})
export class CheckProdGuard {
  constructor(
    private router: Router,
    private appConfigService: AppConfigService,
  ) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isDevMode = this.appConfigService.config['DEV_MODE'] === 'true';
    if (!Object.hasOwn(next.data, 'onlyInDevMode')) {
      return true;
    }
    if (!next.data['onlyInDevMode']) {
      return true;
    }
    if (!isDevMode) {
      this.router.navigate(['/access-deny']);
    }
    return isDevMode;
  }
}
