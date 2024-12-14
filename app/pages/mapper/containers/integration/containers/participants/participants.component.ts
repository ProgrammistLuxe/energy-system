import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IntegrationService } from '../../services/integration.service';
import {
  ActionPanelComponent,
  ApiResolverComponent,
  DeleteConfirmDialogTemplateComponent,
  EmptyTemplateComponent,
} from '@shared/components';
import { materialModules } from '@shared/materials';
import { filter, finalize, ReplaySubject, takeUntil } from 'rxjs';
import { IntegrationParticipant } from '@api-calls/services/http-integrations-service/models';
import { DisplayListDirective, MatIconButtonCustomDirective } from '@shared/index';
import { DialogService } from '@shared/services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';
import { AddParticipantsComponent } from '../../components/add-participants/add-participants.component';

@Component({
  selector: 'app-participants',
  standalone: true,
  imports: [
    CommonModule,
    ActionPanelComponent,
    ApiResolverComponent,
    EmptyTemplateComponent,
    DisplayListDirective,
    MatIconButtonCustomDirective,
    materialModules.matTooltipModule,
    materialModules.matIconModule,
    materialModules.matButtonModule,
  ],
  templateUrl: './participants.component.html',
  styleUrl: './participants.component.scss',
})
export class ParticipantsComponent {
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  private integrationId: number | null = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private integrationService: IntegrationService,
    private dialogService: DialogService,
    private notificationsService: NotificationsService,
  ) {}
  get participantsList() {
    return this.integrationService.integrationParticipantsList;
  }
  addParticipant() {
    if (!this.integrationId) {
      return;
    }
    const dialogRef = this.dialogService.open(AddParticipantsComponent, {
      width: '420px',
      title: 'Добавить участников',
      data: {
        mode: 'add',
        integration_id: this.integrationId,
        integrationParticipantsList: this.integrationService.integrationParticipantsList,
      },
    });
    dialogRef.afterClosed().subscribe((data) => {
      if (!data) {
        return;
      }
      this.getParticipants();
    });
  }
  deleteParticipant(participant: IntegrationParticipant) {
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
          .deleteParticipantFromIntegration({
            integration_id: this.integrationId,
            participant_id: participant.id,
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (response.error) {
              const error = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', error, 'error');
              return;
            }
            this.notificationsService.displayMessage(
              'Успех',
              `Участник ${participant.name} успешно удален`,
              'success',
              3000,
            );
            this.getParticipants();
          });
      });
  }
  getParticipants() {
    if (!this.integrationId) {
      return;
    }
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.integrationService
      .getIntegrationParticipantList(this.integrationId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
        } else {
          this.integrationService.integrationParticipantsList = response.result.data;
        }
      });
  }
  ngOnInit() {
    this.integrationService.selectedIntegration$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (!data) {
        return;
      }
      this.integrationId = data.id;
      if (this.integrationService.integrationParticipantsList.length) {
        return;
      }
      this.getParticipants();
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
