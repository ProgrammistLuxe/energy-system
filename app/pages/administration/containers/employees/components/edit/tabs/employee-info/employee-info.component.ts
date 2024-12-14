import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpUserService } from '@api-calls/services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';
import { ButtonLoadingDirective, FooterComponent, LoadingComponent, MatErrorExtComponent } from '@shared/index';
import { materialModules } from '@shared/materials';
import { ReplaySubject, filter, finalize, takeUntil } from 'rxjs';
import { UserDataService } from '../../../services/user.service';
import { UpdateUser } from '@api-calls/services/http-user-service/models/user-update.model';
import { GetUserGroup } from '@api-calls/services/http-role-group-service/models/get-user-group';
import { mapBackendErrors } from '@core/utils/map-api-error';

@Component({
  selector: 'app-edit-employee-info',
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
export class EditEmployeeInfoComponent {
  loading = true;
  saveLoading = false;
  user$ = this.userDataService.user$;
  form = this.fb.nonNullable.group({
    id: this.fb.control<number | null>(null),
    is_active: this.fb.control<boolean>(true, [Validators.required]),
    last_name: this.fb.control<string | null>(null),
    first_name: this.fb.control<string | null>(null),
    middle_name: this.fb.control<string | null>(null),
    phone: this.fb.control<string | null>(null),
    username: this.fb.control<string>('', [Validators.email, Validators.required]),
    job_title: this.fb.control<string | null>(null),
    appointment: this.fb.control<string | null>(null),
    groups: this.fb.control<GetUserGroup[]>([]),
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
    const { id, is_active, last_name, first_name, middle_name, phone, username, job_title, appointment, groups } =
      this.form.getRawValue();
    if (!this.form.valid || !id || !username || !groups) {
      return;
    }
    this.saveLoading = true;
    const user: UpdateUser = {
      is_active: is_active ?? true,
      id: id,
      last_name: last_name ?? null,
      first_name: first_name ?? null,
      middle_name: middle_name ?? null,
      phone: phone ?? null,
      username: username,
      job_title: job_title ?? null,
      appointment: appointment ?? null,
      groups: groups.map((group) => group.id) ?? [],
    };
    this.httpUserService
      .putAuthUsersById(user)
      .pipe(
        finalize(() => (this.saveLoading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (!this.userDataService.userValue) {
          this.notificationsService.displayMessage('Ошибка', 'Ошибка сохранения', 'error');
          return;
        }
        if (!res.error) {
          this.notificationsService.displayMessage('Успешно', 'Данные пользователя успешно сохранены', 'success', 3000);
          this.httpUserService
            .getAuthUsersById(this.userDataService.userValue.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
              if (res.result) {
                this.userDataService.user = res.result;
              }
            });
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

  ngOnInit() {
    this.userDataService.user$
      .pipe(
        filter((res) => !!res),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (!!res) {
          this.form.patchValue(res);
        }
        this.loading = false;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
