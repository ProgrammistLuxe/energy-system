import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Integration } from '@api-calls/services/http-integrations-service/models';
import { MapperService } from '../../services/mapper.service';
import { finalize, ReplaySubject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ApiResolverComponent } from '@shared/components';
import { MatIconButtonCustomDirective, DisplayListDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';

@Component({
  selector: 'app-mapper-integration-list',
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
  templateUrl: './mapper-integration-list.component.html',
  styleUrl: './mapper-integration-list.component.scss',
})
export class MapperIntegrationListComponent {
  loading: boolean = false;
  integrationList: Integration[] = [];
  errorCode: number | null = null;
  errorMessage: string | null = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private mapperService: MapperService,
  ) {}
  get selectedIntegration() {
    return this.mapperService.selectedIntegration;
  }

  selectIntegration(integration: Integration) {
    this.router.navigate(['./', integration.id], { relativeTo: this.activatedRoute });
  }
  getIntegrationList() {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.mapperService
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
  ngOnInit() {
    this.getIntegrationList();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
