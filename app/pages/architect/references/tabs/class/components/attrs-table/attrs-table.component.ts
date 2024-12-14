import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { GetAttrsRes } from '@api-calls/services/http-references/models/get-attrs-res';
import { getCroppedName } from '@core/utils/cut-prefix';
import { ReferencesService } from '@pages/architect/references/services/references.service';
import { ApiResolverComponent, EmptyTemplateComponent } from '@shared/components';
import { materialModules } from '@shared/materials';
import { DefaultPipe } from '@shared/pipes';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';

interface AttrResTableData extends GetAttrsRes {
  inherited: boolean;
}
@Component({
  selector: 'app-attrs-table',
  imports: [
    CommonModule,
    materialModules.matTableModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    ApiResolverComponent,
    EmptyTemplateComponent,
    DefaultPipe,
  ],
  templateUrl: './attrs-table.component.html',
  styleUrl: './attrs-table.component.scss',
})
export class AttrsTableComponent {
  @Input() class_name: string = '';
  columns: string[] = ['attr_name', 'description', 'class_name', 'prefix_short', 'type'];
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  tableData: AttrResTableData[] = [];
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(private referencesService: ReferencesService) {}
  loadAttrs() {
    if (!this.class_name) {
      return;
    }
    this.loading = true;
    this.referencesService
      .getAttrs(getCroppedName(this.class_name))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((res) => {
        if (res.error) {
          this.errorCode = +res;
          this.errorMessage = String(res);
          return;
        }
        this.tableData = res.result.map((item) => ({
          ...item,
          inherited: item.class_name !== getCroppedName(this.class_name),
        }));
      });
  }
  ngOnInit() {
    this.loadAttrs();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
