import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapperService } from '../../services/mapper.service';
import { finalize, forkJoin, mergeMap, of, ReplaySubject, switchMap, takeUntil } from 'rxjs';
import { IntegrationClassType, IntegrationParticipant } from '@api-calls/services/http-integrations-service/models';
import { NotificationsService } from '@services';
import { CommonModule } from '@angular/common';
import { BreadcrumbsComponent, ApiResolverComponent, EmptyTemplateComponent } from '@shared/components';
import { materialModules } from '@shared/materials';
import { ActionPanelComponent } from '@shared/components/action-panel/action-panel.component';
import { SynchronizationTableComponent } from '../synchronization-table/synchronization-table.component';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';

@Component({
  selector: 'app-selected-integration',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ApiResolverComponent,
    EmptyTemplateComponent,
    SynchronizationTableComponent,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    ActionPanelComponent,
    SynchronizationTableComponent,
  ],
  templateUrl: './selected-integration.component.html',
  styleUrl: './selected-integration.component.scss',
})
export class SelectedIntegrationComponent {
  loading: boolean = true;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  integrationParticipantsList: IntegrationParticipant[] = [];
  classTypeList: IntegrationClassType[] = [];
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private currentId: number | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private mapperService: MapperService,
    private notificationsService: NotificationsService,
  ) {}
  get selectedIntegration() {
    return this.mapperService.selectedIntegration;
  }

  getIntegration() {
    if (!this.currentId) {
      return;
    }
    this.errorCode = null;
    this.errorMessage = null;
    this.loading = true;
    this.mapperService
      .getIntegration(this.currentId)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((response) => {
          if (response.error) {
            this.errorCode = +response;
            this.errorMessage = String(response);
            return of(null);
          } else if (!this.currentId) {
            return of(null);
          } else {
            this.mapperService.selectedIntegration = response.result;
            return forkJoin([
              this.mapperService.getClassTypeList(this.currentId),
              this.mapperService.getIntegrationParticipantList(this.currentId),
            ]);
          }
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }
        if (response[0].error) {
          const message = getErrorsMessage(response[0].error) || 'Ошибка получения списка классов';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
        } else {
          this.classTypeList = response[0].result.data;
        }
        if (response[1].error) {
          const message = getErrorsMessage(response[1].error) || 'Ошибка получения списка участников';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
        } else {
          this.integrationParticipantsList = response[1].result.data;
        }
      });
  }
  ngOnInit() {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params['id'];
      if (!id) {
        return;
      }
      this.mapperService.selectedIntegration = null;
      this.mapperService.selectedClassType = null;
      this.mapperService.filteredAttrs = null;
      this.currentId = +id;
      this.getIntegration();
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.mapperService.selectedIntegration = null;
    this.mapperService.selectedClassType = null;
    this.mapperService.filteredAttrs = null;
  }
}
