import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpUserService } from '@api-calls/services';
import { HttpAuthService } from '@api-calls/services/http-auth-service/http-auth.service';
import { UserAuthService } from '@core/services/user-auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { LocalStorageService, NotificationsService } from '@services';
import { ButtonLoadingDirective, MatErrorExtComponent, materialModules } from '@shared/index';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    ButtonLoadingDirective,
    MatErrorExtComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  @HostListener('document:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.login();
    }
  }

  loading: boolean = false;
  form = this.fb.nonNullable.group({
    login: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  hide = true;

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private fb: FormBuilder,
    private httpAuthService: HttpAuthService,
    private userAuthService: UserAuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private notificationsService: NotificationsService,
    private httpUserService: HttpUserService,
    private userStateService: UserStateService,
  ) {}

  login() {
    const value = this.form.value;
    if (!value.login || !value.password) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.httpAuthService
      .postAuthJwtCreate(value.login, value.password)
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        if (data.error) {
          this.notificationsService.displayMessage('Ошибка', 'Неверные данные. Попробуйте заново', 'error');
          this.form.controls['login'].setErrors({ incorrect: true });
          this.form.controls['password'].setErrors({ incorrect: true });
          return;
        }
        this.userAuthService.login(data.result);
        this.httpUserService
          .getAuthMe()
          .pipe(
            finalize(() => (this.loading = false)),
            takeUntil(this.destroy$),
          )
          .subscribe((user) => {
            if (user.error) {
              return;
            }
            this.userStateService.user = user.result;
            this.notificationsService.displayMessage('Успешно', 'Авторизация прошла успешно', 'success', 3000);
            const queryParams = this.activatedRoute.snapshot.queryParams['redirectUrlQueryParams']
              ? JSON.parse(this.activatedRoute.snapshot.queryParams['redirectUrlQueryParams'])
              : {};
            const navigateUrl = this.activatedRoute.snapshot.queryParams['redirectUrl']
              ? this.activatedRoute.snapshot.queryParams['redirectUrl']
              : 'administration';

            this.router
              .navigate([navigateUrl], {
                queryParams,
              })
              .then();
          });
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
