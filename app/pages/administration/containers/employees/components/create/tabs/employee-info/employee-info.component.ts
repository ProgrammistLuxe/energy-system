import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpUserService } from '@api-calls/services';
import { CreateUser } from '@api-calls/services/http-user-service/models/user-create.model';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';
import { ButtonLoadingDirective, FooterComponent, LoadingComponent, MatErrorExtComponent } from '@shared/index';
import { materialModules } from '@shared/materials';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';
import { UserDataService } from '../../../services/user.service';
import { mapBackendErrors } from '@core/utils/map-api-error';

@Component({
  selector: 'app-create-employee-info',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matRadioModule,
    materialModules.matInputModule,
    materialModules.matSelectModule,
    materialModules.matOptionModule,
    materialModules.matButtonModule,
    materialModules.matChipsModule,
    materialModules.matIconModule,
    MatErrorExtComponent,
    LoadingComponent,
    FooterComponent,
    ButtonLoadingDirective,
  ],
  templateUrl: './employee-info.component.html',
  styleUrl: './employee-info.component.scss',
})
export class CreateEmployeeInfoComponent {
  loading = false;
  saveLoading = false;
  user$ = this.userDataService.user$;
  form = this.fb.nonNullable.group({
    is_active: this.fb.control<boolean | null>(true, [Validators.required]),
    last_name: this.fb.control<string | null>(null),
    first_name: this.fb.control<string | null>(null),
    middle_name: this.fb.control<string | null>(null),
    phone: this.fb.control<string | null>(null),
    username: this.fb.control<string | null>(null, [Validators.email, Validators.required]),
    job_title: this.fb.control<string | null>(null),
    appointment: this.fb.control<string | null>(null),
  });

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private notificationsService: NotificationsService,
    private fb: FormBuilder,
    private userDataService: UserDataService,
    private httpUserService: HttpUserService,
  ) {}

  save() {
    const { is_active, last_name, first_name, middle_name, phone, username, job_title, appointment } =
      this.form.getRawValue();
    if (!this.form.valid || !username) {
      return;
    }
    this.saveLoading = true;
    const user: CreateUser = {
      is_active: is_active ?? true,
      last_name: last_name ?? null,
      first_name: first_name ?? null,
      middle_name: middle_name ?? null,
      phone: phone ?? null,
      username: username,
      job_title: job_title ?? null,
      appointment: appointment ?? null,
    };
    this.httpUserService
      .postAuthUserCreate(user)
      .pipe(
        finalize(() => (this.saveLoading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res: any) => {
        if (!res.error) {
          this.router
            .navigate(['../../', res.result.id], {
              queryParamsHandling: 'preserve',
              relativeTo: this.activatedRoute,
            })
            .then();
          this.notificationsService.displayMessage('Успешно', 'Данные пользователя успешно сохранены', 'success', 3000);
        } else {
          mapBackendErrors(res.error, this.form);
          const errorMessage = getErrorsMessage(res.error) || 'Ошибка сохранения';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }

  back() {
    this.router.navigate(['../../'], { queryParamsHandling: 'preserve', relativeTo: this.activatedRoute });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
