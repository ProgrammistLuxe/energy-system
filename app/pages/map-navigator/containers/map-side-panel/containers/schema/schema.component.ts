import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ApiResolverComponent, EmptyTemplateComponent, materialModules } from '@shared/index';
import { SchemaChartComponent } from './components/schema-chart/schema-chart.component';
import { PassportsTreeService } from '@features/passports-tree/services/passports-tree.service';
import { BehaviorSubject, ReplaySubject, takeUntil, finalize } from 'rxjs';
import { SchemasService } from './services/schemas.service';

@Component({
  selector: 'app-schema',
  imports: [
    CommonModule,
    ApiResolverComponent,
    SchemaChartComponent,
    EmptyTemplateComponent,
    materialModules.matIconModule,
  ],
  providers: [SchemasService],
  templateUrl: './schema.component.html',
  styleUrl: './schema.component.scss',
})
export class SchemaComponent {
  loading: boolean = false;
  iconsLoading$: BehaviorSubject<boolean> = this.schemasService.iconsLoading$;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  schemaData: string = '';
  private uid: string | null = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private schemasService: SchemasService,
    private passportsTreeService: PassportsTreeService,
  ) {}
  getSchema() {
    if (!this.uid) {
      return;
    }
    this.errorCode = null;
    this.errorMessage = null;
    this.loading = true;
    this.schemasService
      .loadSchema(this.uid, 'json-ld')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((res) => {
        if (!res.error) {
          this.schemaData = res.result.data;
        } else {
          this.errorCode = +res;
          this.errorMessage = String(res);
        }
      });
  }
  ngOnInit() {
    this.schemasService.getIcons();
    this.passportsTreeService.selectedUID$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.uid = this.passportsTreeService.selectedUID;
      this.getSchema();
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
