import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpAuthService } from '@api-calls/services/http-auth-service/http-auth.service';
import { mapBackendErrors } from '@core/utils/map-api-error';
import { NotificationsService } from '@services';
import { ButtonLoadingDirective, MatErrorExtComponent, materialModules } from '@shared/index';
import { PasswordsUnequalValidator } from '@shared/validators';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'app-password-change',
  imports: [
    CommonModule,
    materialModules.matInputModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    ButtonLoadingDirective,
    MatErrorExtComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './password-change.component.html',
  styleUrls: ['./password-change.component.scss'],
})
export class PasswordChangeComponent {
  loading: boolean = false;
  form = this.fb.nonNullable.group({
    current_password: ['', [Validators.required]],
    new_password: ['', [Validators.required, PasswordsUnequalValidator()]],
  });
  hide1 = true;
  hide2 = true;

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private fb: FormBuilder,
    private httpAuthService: HttpAuthService,
    private router: Router,
    private notificationsService: NotificationsService,
  ) {}

  changePassword() {
    const { current_password, new_password } = this.form.value;
    if (this.form.invalid || !current_password || !new_password) {
      return;
    }
    this.loading = true;
    this.httpAuthService
      .postAuthChangePassword(current_password, new_password)
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        if (!data.error) {
          this.notificationsService.displayMessage('Успешно', 'Установлен новый пароль', 'success', 3000);
          this.router.navigate(['/auth']).then();
        } else {
          mapBackendErrors(data.error, this.form);
          this.notificationsService.displayMessage('Ошибка', 'Ошибка сохранения пароля. Попробуйте заново', 'error');
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
