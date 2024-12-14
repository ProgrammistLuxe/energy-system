import { Component, Inject } from '@angular/core';
import { IntegrationService } from '../../services/integration.service';
import { ApiResolverComponent, ButtonLoadingDirective, materialModules, MatErrorExtComponent } from '@shared/index';
import { CommonModule } from '@angular/common';
import { FormControl, Validators } from '@angular/forms';
import { finalize, ReplaySubject, take, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Participant } from '@api-calls/services/http-participants-service/models';
import { IntegrationParticipant } from '@api-calls/services/http-integrations-service/models';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';

@Component({
  selector: 'app-add-participants',
  standalone: true,
  imports: [
    CommonModule,
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matSelectModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    MatErrorExtComponent,
    ApiResolverComponent,
    ButtonLoadingDirective,
  ],
  providers: [IntegrationService],
  templateUrl: './add-participants.component.html',
  styleUrl: './add-participants.component.scss',
})
export class AddParticipantsComponent {
  loading: boolean = false;
  saveLoading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  participantList: Participant[] = [];
  participantsControl: FormControl<number[]> = new FormControl<number[]>([], {
    validators: [Validators.required],
    nonNullable: true,
  });
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private dialogRef: MatDialogRef<AddParticipantsComponent>,
    @Inject(MAT_DIALOG_DATA)
    private data: {
      integration_id: number;
      integrationParticipantsList: IntegrationParticipant[];
    },
    private integrationService: IntegrationService,
    private notificationsService: NotificationsService,
  ) {}
  getParticipantList() {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.integrationService
      .getParticipantList()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
        } else {
          this.participantList = response.result.data.filter(
            (item) => !this.data.integrationParticipantsList.map((el) => el.id).includes(item.id),
          );
        }
      });
  }
  addParticipant() {
    this.saveLoading = true;
    const participant_id_list = this.participantsControl.getRawValue();
    this.integrationService
      .addParticipantsToIntegration({ integration_id: this.data.integration_id, participant_id_list })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          const message = getErrorsMessage(response.error) || 'Ошибка добавления';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
          return;
        } else {
          this.notificationsService.displayMessage('Успех', 'Успешно добавлено', 'success', 3000);
          this.dialogRef.close(response.result);
        }
      });
  }
  ngOnInit() {
    this.getParticipantList();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
