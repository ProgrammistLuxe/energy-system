import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpAuthService } from '@api-calls/services/http-auth-service/http-auth.service';
import { mapBackendErrors } from '@core/utils/map-api-error';
import { NotificationsService } from '@services';
import { ButtonLoadingDirective, MatErrorExtComponent, materialModules } from '@shared/index';
import { PasswordsEqualValidator } from '@shared/validators';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'app-password-create',
  imports: [
    CommonModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    ButtonLoadingDirective,
    MatErrorExtComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './password-create.component.html',
  styleUrls: ['./password-create.component.scss'],
})
export class PasswordCreateComponent {
  loading: boolean = false;
  form = this.fb.nonNullable.group({
    password: ['', [Validators.required]],
    password_repeat: ['', [Validators.required, PasswordsEqualValidator()]],
  });
  hide1 = true;
  hide2 = true;
  uid: string = '';
  token: string = '';

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private fb: FormBuilder,
    private httpAuthService: HttpAuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private notificationsService: NotificationsService,
  ) {}
  handleInputCopy(event: Event) {
    event.preventDefault();
    this.notificationsService.displayMessage('Ошибка', 'Это поле нельзя скопировать', 'error', 2000);
  }
  createPassword() {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.httpAuthService
      .postAuthResetPasswordConfirm(this.uid, this.token, this.form.get('password')?.value ?? '')
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        if (!data.error) {
          this.notificationsService.displayMessage('Успешно', 'Пароль создан успешно', 'success', 3000);
          this.router.navigate(['/auth']).then();
        } else {
          mapBackendErrors(data.error, this.form);
          this.notificationsService.displayMessage('Ошибка', 'Ошибка создания пароля. Попробуйте заново', 'error');
        }
      });
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.uid = params['uid'];
      this.token = params['jwt'];
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
