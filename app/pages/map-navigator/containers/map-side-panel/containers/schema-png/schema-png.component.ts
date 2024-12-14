import { Component } from '@angular/core';
import { MapService } from '../../../../services/map.service';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';
import { PassportsTreeService } from '@features/passports-tree/services/passports-tree.service';
import { CommonModule } from '@angular/common';
import { util } from '@joint/core';
import {
  DisplayListDirective,
  EmptyTemplateComponent,
  LoadingComponent,
  OverFlowTooltipDirective,
  materialModules,
} from '@shared/index';
interface SchemaListItem {
  uid: string;
  name: string;
}
@Component({
  selector: 'app-schema-png',
  imports: [
    CommonModule,
    materialModules.matDividerModule,
    materialModules.matIconModule,
    materialModules.matButtonModule,
    OverFlowTooltipDirective,
    DisplayListDirective,
    LoadingComponent,
    EmptyTemplateComponent,
  ],
  templateUrl: './schema-png.component.html',
  styleUrl: './schema-png.component.scss',
})
export class SchemaPngComponent {
  schemasList: SchemaListItem[] = [];
  loading: boolean = false;
  listLoading: boolean = false;
  currentBase64: string = '';
  selectedSchema: SchemaListItem | null = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private mapService: MapService,
    private passportsTreeService: PassportsTreeService,
  ) {}
  selectSchema(schema: SchemaListItem) {
    this.selectedSchema = schema;
    this.currentBase64 = '';
    this.loading = true;
    this.mapService
      .getPng(schema.uid)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.currentBase64 = response.result.data;
        } else {
          this.currentBase64 = '';
        }
      });
  }
  toggleFullScreen() {
    const image = document.querySelector('.image');
    if (!image) {
      return;
    }
    util.toggleFullScreen(image);
  }
  private loadSchemasList() {
    const uid = this.passportsTreeService.selectedUID;
    if (!uid) {
      return;
    }
    this.listLoading = true;
    this.mapService
      .getPngList(uid)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.listLoading = false)),
      )
      .subscribe((response) => {
        if (!response.error) {
          this.schemasList = Object.entries(response.result.data).map((item) => ({
            name: item[0],
            uid: item[1],
          }));
        }
      });
  }
  ngOnInit() {
    this.passportsTreeService.selectedUID$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadSchemasList();
      this.currentBase64 = '';
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
