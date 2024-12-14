import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ApiResolverComponent, BreadcrumbsComponent, EmptyTemplateComponent } from '@shared/components';
import { ParticipantsComponent } from '../participants/participants.component';
import { AttrsComponent } from '../attrs/attrs.component';
import { ClassTypesComponent } from '../class-types/class-types.component';
import { IntegrationService } from '../../services/integration.service';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin, ReplaySubject, takeUntil } from 'rxjs';
import { materialModules } from '@shared/materials';

@Component({
  selector: 'app-integration',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbsComponent,
    ParticipantsComponent,
    AttrsComponent,
    ClassTypesComponent,
    ApiResolverComponent,
    EmptyTemplateComponent,
    materialModules.matIconModule,
    materialModules.matDividerModule,
  ],
  templateUrl: './integration.component.html',
  styleUrl: './integration.component.scss',
})
export class IntegrationComponent {
  loading: boolean = true;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private currentId: number | null = null;
  constructor(
    private integrationService: IntegrationService,
    private activatedRoute: ActivatedRoute,
  ) {}

  get selectedIntegration() {
    return this.integrationService.selectedIntegration;
  }
  getIntegration() {
    if (!this.currentId) {
      return;
    }
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    forkJoin([
      this.integrationService.getIntegrationById(this.currentId),
      this.integrationService.getIntegrationParticipantList(this.currentId),
    ])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe(([response1, response2]) => {
        if (!response2.error) {
          this.integrationService.integrationParticipantsList = response2.result.data;
        }
        if (response1.error) {
          this.errorCode = +response1;
          this.errorMessage = String(response1);
        } else {
          this.integrationService.selectedIntegration = response1.result;
        }
      });
  }
  ngOnInit() {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params['id'];
      if (!id) {
        return;
      }
      this.integrationService.integrationParticipantsList = [];
      this.integrationService.selectedIntegration = null;
      this.integrationService.selectedClassType = null;
      this.currentId = +id;
      this.getIntegration();
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
