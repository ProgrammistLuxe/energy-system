import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { materialModules } from '@shared/materials';
import { ReferencesService } from '../services/references.service';
import { ButtonLoadingDirective } from '@shared/directives';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';
import { downloadData } from '@core/utils/download-data';

@Component({
  selector: 'app-reference-actions',
  imports: [CommonModule, materialModules.matIconModule, materialModules.matButtonModule, ButtonLoadingDirective],
  templateUrl: './reference-actions.component.html',
  styleUrl: './reference-actions.component.scss',
})
export class ReferenceActionsComponent {
  uploadLoading: boolean = false;
  downloadLoading: boolean = false;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private router: Router,
    private referencesService: ReferencesService,
    private route: ActivatedRoute,
    private notificationsService: NotificationsService,
  ) {}
  downloadProfile() {
    this.downloadLoading = true;
    this.referencesService
      .downloadProfile()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.downloadLoading = false)),
      )
      .subscribe((res) => {
        if (res.error) {
          const errMsg = getErrorsMessage(res.error) || 'Ошибка загрузки';
          this.notificationsService.displayMessage('Ошибка', errMsg, 'error');
        } else {
          const val = atob(res.result.data);
          const byteNumbers = new Array(val.length);
          for (let i = 0; i < val.length; i++) {
            byteNumbers[i] = val.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8',
          });
          downloadData(
            blob,
            'Профиль',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8',
            'xlsx',
          );
          this.notificationsService.displayMessage('Успех', 'Текущий профиль успешно выгружен', 'success', 3000);
        }
      });
  }
  uploadProfile(file: HTMLInputElement | null) {
    if (!file) {
      this.uploadLoading = false;
      return;
    }
    file.files = null;
    this.uploadLoading = true;
    file.value = '';
    file.click();
    file.oncancel = () => {
      this.uploadLoading = false;
    };
    file.onclose = () => {
      this.uploadLoading = false;
    };
    file.onchange = () => {
      if (!file.files) {
        this.uploadLoading = false;
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file.files[0]);
      reader.onload = (event) => {
        if (!event.target || !event.target?.result) {
          this.uploadLoading = false;
          return;
        }
        this.referencesService
          .uploadProfile(event.target.result.toString())
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => (this.uploadLoading = false)),
          )
          .subscribe((res) => {
            if (res.error) {
              const errMsg = getErrorsMessage(res.error) || 'Ошибка загрузки';
              this.notificationsService.displayMessage('Ошибка', errMsg, 'error');
            } else {
              this.notificationsService.displayMessage('Успех', 'Профиль успешно загружен', 'success', 3000);
            }
          });
      };
    };
  }
  goToProfile() {
    this.router.navigate(['../profile'], { relativeTo: this.route });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
