import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GetGraphDlpSchema } from '@api-calls/services/http-dlp-service/models';
import { SchemaChartComponent } from '@pages/schemas/components/schema-chart/schema-chart.component';
import { jsonLd } from '@pages/schemas/consts/json-ld';
import { SchemasService } from '@pages/schemas/services/schemas.service';
import { ApiResolverComponent, EmptyTemplateComponent, materialModules } from '@shared/index';
import { BehaviorSubject, ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-schema',
  imports: [
    CommonModule,
    EmptyTemplateComponent,
    ApiResolverComponent,
    SchemaChartComponent,
    materialModules.matIconModule,
  ],
  templateUrl: './schema.component.html',
  styleUrl: './schema.component.scss',
})
export class SchemaComponent {
  schema: GetGraphDlpSchema | null = null;
  private uid: string | null = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  iconsLoading$: BehaviorSubject<boolean> = this.schemasService.iconsLoading$;
  constructor(
    private route: ActivatedRoute,
    private schemasService: SchemasService,
  ) {}
  getSchema() {
    if (!this.uid) {
      return;
    }
    this.schema = {
      uid: 'gggg',
      name: 'Тестовая',
      schema: jsonLd,
    };
    this.schemasService.selectedSchema = this.schema;
  }
  ngOnInit() {
    this.schemasService.getIcons();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((param) => {
      if (!param['id']) {
        return;
      }
      this.uid = param['id'];
      this.getSchema();
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
