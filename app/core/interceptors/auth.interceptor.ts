import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UserAuthService, LocalStorageService } from '@services';
import { Router } from '@angular/router';
import { HttpAuthService } from '@api-calls/services/index';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: UserAuthService,
    private userApiService: HttpAuthService,
    private localStorageService: LocalStorageService,
    private router: Router,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authReq = req.clone();
    return next.handle(authReq).pipe(
      tap({
        next: () => {},
        error: (err: any) => {
          if (!(err instanceof HttpErrorResponse)) {
            return;
          }
          if (!err.error?.errors) {
            return;
          }
          const errorCode: string = err.error?.errors[0]?.code || '';
          if (err.status === 401 && (errorCode === 'authentication_failed' || errorCode === 'token_not_valid')) {
            const refreshToken = this.localStorageService.get('refresh');
            this.userApiService.PostUserJwtRefresh(refreshToken).subscribe((response) => {
              if (response.error) {
                this.authService.logOut();
                this.router.navigate(['auth']).then();
                return;
              }
              this.localStorageService.set('access', response.result.access);
              authReq.headers.append('Authorization', 'JWT ' + response.result.access);
            });
          }
        },
      }),
    );
  }
}
