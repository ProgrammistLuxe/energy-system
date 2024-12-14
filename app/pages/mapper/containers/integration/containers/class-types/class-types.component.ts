import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IntegrationClassType } from '@api-calls/services/http-integrations-service/models';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { AddClassTypeComponent } from '../../components/add-class-type/add-class-type.component';
import { IntegrationService } from '../../services/integration.service';
import { NotificationsService } from '@services';
import { ActionPanelComponent, ApiResolverComponent, DeleteConfirmDialogTemplateComponent } from '@shared/components';
import { DisplayListDirective, MatIconButtonCustomDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';
import { DialogService } from '@shared/services';
import { filter, finalize, ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-class-types',
  standalone: true,
  imports: [
    ActionPanelComponent,
    ApiResolverComponent,
    DisplayListDirective,
    MatIconButtonCustomDirective,
    CommonModule,
    materialModules.matIconModule,
    materialModules.matButtonModule,
    materialModules.matTooltipModule,
  ],
  templateUrl: './class-types.component.html',
  styleUrl: './class-types.component.scss',
})
export class ClassTypesComponent {
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  classTypesList: IntegrationClassType[] = [];
  private integrationId: number | null = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private integrationService: IntegrationService,
    private dialogService: DialogService,
    private notificationsService: NotificationsService,
  ) {}
  get selectedClassType() {
    return this.integrationService.selectedClassType;
  }
  getClassTypeList() {
    if (!this.integrationId) {
      return;
    }
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.integrationService
      .getIntegrationClassTypeList(this.integrationId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
        } else {
          this.classTypesList = response.result.data;
        }
      });
  }
  openEditClassTypeDialog(classType: IntegrationClassType | null = null) {
    if (!this.integrationId) {
      return;
    }
    if (!!classType) {
      const dialogRef = this.dialogService.open(AddClassTypeComponent, {
        width: '420px',
        title: 'Обновить тип данных',
        data: { mode: 'edit', integration_id: this.integrationId, classType },
      });
      dialogRef.afterClosed().subscribe((data) => {
        if (!data) {
          return;
        }
        this.getClassTypeList();
      });
    } else {
      const dialogRef = this.dialogService.open(AddClassTypeComponent, {
        width: '420px',
        title: 'Создать тип данных',
        data: { mode: 'add', integration_id: this.integrationId },
      });
      dialogRef.afterClosed().subscribe((data) => {
        if (!data) {
          return;
        }
        this.getClassTypeList();
      });
    }
  }
  deleteClassType(classType: IntegrationClassType) {
    if (!this.integrationId) {
      return;
    }
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
        if (!this.integrationId) {
          return;
        }
        this.integrationService
          .deleteClassType(classType.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (response.error) {
              const error = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', error, 'error');
              return;
            }
            if (this.selectedClassType?.id === classType.id) {
              this.integrationService.selectedClassType = null;
            }
            this.getClassTypeList();
            this.notificationsService.displayMessage(
              'Успех',
              `Тип данных ${classType.name} успешно удален`,
              'success',
              3000,
            );
          });
      });
  }
  selectClassType(classType: IntegrationClassType) {
    this.integrationService.selectedClassType = classType;
  }
  ngOnInit() {
    this.integrationService.selectedIntegration$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (!data) {
        return;
      }
      this.integrationId = data.id;
      this.getClassTypeList();
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
