import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IntegrationService } from '../../services/integration.service';
import { ApiResolverComponent, DeleteConfirmDialogTemplateComponent } from '@shared/components';
import { materialModules } from '@shared/materials';
import { filter, finalize, ReplaySubject, takeUntil } from 'rxjs';
import { Integration } from '@api-calls/services/http-integrations-service/models';
import { DisplayListDirective, MatIconButtonCustomDirective } from '@shared/directives';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '@shared/services';
import { NotificationsService } from '@services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { AddIntegrationComponent } from '../../components/add-integration/add-integration.component';

@Component({
  selector: 'app-integration-list',
  standalone: true,
  imports: [
    CommonModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    MatIconButtonCustomDirective,
    ApiResolverComponent,
    DisplayListDirective,
  ],
  templateUrl: './integration-list.component.html',
  styleUrl: './integration-list.component.scss',
})
export class IntegrationListComponent {
  loading: boolean = false;
  integrationList: Integration[] = [];
  errorCode: number | null = null;
  errorMessage: string | null = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private integrationService: IntegrationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialogService: DialogService,
    private notificationsService: NotificationsService,
  ) {}
  get selectedIntegration() {
    return this.integrationService.selectedIntegration;
  }

  selectIntegration(integration: Integration) {
    this.router.navigate(['./', integration.id], { relativeTo: this.activatedRoute });
  }
  getIntegrationList() {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.integrationService
      .getIntegrationList()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
        } else {
          this.integrationList = response.result.data;
        }
      });
  }
  deleteIntegration(integration: Integration) {
    const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
      DeleteConfirmDialogTemplateComponent,
      {
        title: 'Удалить элемент',
        data: 'Вы уверены хотите удалить элемент?',
      },
    );
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.integrationService.deleteIntegration(integration.id).subscribe((response) => {
          if (response.error) {
            const error = getErrorsMessage(response.error) || 'Ошибка удаления';
            this.notificationsService.displayMessage('Ошибка', error, 'error');
            return;
          }
          this.notificationsService.displayMessage(
            'Успех',
            `Интеграция ${integration.name} успешно удалена`,
            'success',
            3000,
          );
          if (this.integrationService.selectedIntegration?.id === integration.id) {
            this.integrationService.selectedIntegration = null;
            this.router.navigate(['../']);
          }
          this.getIntegrationList();
        });
      });
  }
  openEditIntegrationSystemDialog(integration: Integration | null = null) {
    if (!!integration) {
      const dialogRef = this.dialogService.open(AddIntegrationComponent, {
        width: '420px',
        title: 'Обновить интеграцию',
        data: { mode: 'edit', integration_id: integration.id, name: integration.name },
      });
      dialogRef.afterClosed().subscribe((data) => {
        if (!data) {
          return;
        }
        this.getIntegrationList();
      });
    } else {
      const dialogRef = this.dialogService.open(AddIntegrationComponent, {
        width: '420px',
        title: 'Создать интеграцию',
        data: { mode: 'add' },
      });
      dialogRef.afterClosed().subscribe((data) => {
        if (!data) {
          return;
        }
        this.getIntegrationList();
      });
    }
  }

  ngOnInit() {
    this.getIntegrationList();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
