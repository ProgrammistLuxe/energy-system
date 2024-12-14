import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GetGraphDlpSchema } from '@api-calls/services/http-dlp-service/models';
import { jsonLd } from '@pages/schemas/consts/json-ld';
import { SchemasService } from '@pages/schemas/services/schemas.service';
import { ApiResolverComponent, EmptyTemplateComponent, OverFlowTooltipDirective } from '@shared/index';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'app-schemas-list',
  imports: [CommonModule, ApiResolverComponent, EmptyTemplateComponent, OverFlowTooltipDirective],
  templateUrl: './schemas-list.component.html',
  styleUrl: './schemas-list.component.scss',
})
export class SchemasListComponent {
  schemasList: GetGraphDlpSchema[] = [];
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private schemasService: SchemasService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}
  get selectedSchema(): GetGraphDlpSchema | null {
    return this.schemasService.selectedSchema;
  }
  loadSchemas() {
    this.schemasList = [
      {
        uid: 'gggg',
        name: 'Тестовая',
        schema: jsonLd,
      },
    ];
  }
  selectSchema(item: GetGraphDlpSchema) {
    this.schemasService.selectedSchema = item;
    this.router.navigate([item.uid], { relativeTo: this.route });
  }
  ngOnInit() {
    this.loadSchemas();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
