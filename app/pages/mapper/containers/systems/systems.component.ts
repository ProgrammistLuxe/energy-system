import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  ActionPanelComponent,
  ApiResolverComponent,
  BreadcrumbsComponent,
  DeleteConfirmDialogTemplateComponent,
  EmptyTemplateComponent,
} from '@shared/components';
import { materialModules } from '@shared/materials';
import { DialogService } from '@shared/services';
import { EditSystemComponent } from './components/edit-system/edit-system.component';
import { SystemsService } from './services/systems.service';
import { filter, finalize, ReplaySubject, take, takeUntil } from 'rxjs';
import { Participant } from '@api-calls/services/http-participants-service/models';
import { NotificationsService } from '@services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { MatIconButtonCustomDirective } from '@shared/directives';

@Component({
  selector: 'app-systems',
  standalone: true,
  imports: [
    CommonModule,
    EmptyTemplateComponent,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    MatIconButtonCustomDirective,
    ApiResolverComponent,
    BreadcrumbsComponent,
    ActionPanelComponent,
  ],
  providers: [SystemsService],
  templateUrl: './systems.component.html',
  styleUrl: './systems.component.scss',
})
export class SystemsComponent {
  systemList: Participant[] = [];
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private dialogService: DialogService,
    private systemsService: SystemsService,
    private notificationsService: NotificationsService,
  ) {}

  openEditSystemDialog(system: Participant | null = null) {
    if (!!system) {
      const dialogRef = this.dialogService.open(EditSystemComponent, {
        width: '419px',
        title: 'Обновить систему',
        data: { mode: 'edit', participant_id: system.id, name: system.name },
      });
      dialogRef.afterClosed().subscribe((data) => {
        if (!data) {
          return;
        }
        this.getSystemList();
      });
    } else {
      const dialogRef = this.dialogService.open(EditSystemComponent, {
        width: '419px',
        title: 'Создать систему',
        data: { mode: 'add' },
      });
      dialogRef.afterClosed().subscribe((data) => {
        if (!data) {
          return;
        }
        this.getSystemList();
      });
    }
  }
  deleteSystem(system: Participant) {
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
        this.systemsService
          .deleteSystem(system.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (response.error) {
              const error = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', error, 'error');
            } else {
              this.notificationsService.displayMessage(
                'Успех',
                `Система ${system.name} успешно удалена`,
                'success',
                3000,
              );
              this.getSystemList();
            }
          });
      });
  }
  getSystemList() {
    this.errorCode = null;
    this.errorMessage = null;
    this.loading = true;
    this.systemsService
      .getSystemList()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
          return;
        } else {
          this.systemList = response.result.data;
        }
      });
  }
  ngOnInit() {
    this.getSystemList();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
