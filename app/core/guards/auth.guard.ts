import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlSerializer } from '@angular/router';
import { UserAuthService } from '@core/services/user-auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  constructor(
    private authService: UserAuthService,
    private router: Router,
    private urlSerializer: UrlSerializer,
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    const authorized = this.authService.isAuthValue;
    const url = state.url.includes('%23') ? state.url.replace('%23', '#') : state.url;
    if (!authorized) {
      this.router
        .navigate(['auth'], {
          queryParams: {
            redirectUrl: url || '',
            redirectUrlQueryParams: JSON.stringify(next.queryParams),
          },
        })
        .then();
    }
    return authorized;
  }
}
