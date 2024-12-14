import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatChipSelectionChange } from '@angular/material/chips';
import { Params, Router, RouterModule } from '@angular/router';
import { GetPassportFilesReq, GetPassportReq, PassportData } from '@api-calls/services/http-graph-service/models';
import { PassportsTreeService } from '@features/passports-tree/services/passports-tree.service';
import { MapService } from '@pages/map-navigator/services/map.service';
import { NotificationsService } from '@services';
import { ApiResolverComponent, EmptyTemplateComponent } from '@shared/components';
import {
  ButtonLoadingDirective,
  CheckScrollDirective,
  MatIconButtonCustomDirective,
  OverFlowTooltipDirective,
} from '@shared/directives';
import { CustomIconsModule } from '@shared/index';
import { materialModules } from '@shared/materials';
import { DefaultPipe } from '@shared/pipes';
import { TableVirtualScrollModule, TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { ReplaySubject, takeUntil, finalize } from 'rxjs';
export interface TabData {
  label: string;
  displayedColumns: string[];
  data: TableVirtualScrollDataSource<Array<{ value: any; info: string } | null>>;
}
@Component({
  selector: 'app-passport-view',
  imports: [
    CommonModule,
    materialModules.matTableModule,
    materialModules.matIconModule,
    materialModules.matTabsModule,
    materialModules.virtualScroll,
    materialModules.matChipsModule,
    materialModules.matButtonModule,
    materialModules.matTooltipModule,
    ButtonLoadingDirective,
    CustomIconsModule,
    MatIconButtonCustomDirective,
    RouterModule,
    TableVirtualScrollModule,
    DefaultPipe,
    CheckScrollDirective,
    OverFlowTooltipDirective,
    ApiResolverComponent,
    EmptyTemplateComponent,
  ],
  templateUrl: './passport-view.component.html',
  styleUrl: './passport-view.component.scss',
})
export class PassportViewComponent {
  loading: boolean = true;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  passportData: PassportData[] = [];
  calculatedPassportData: TabData[] = [];
  displayedColumns: string[] = [];
  dynamicColumns: { title: string; id: string }[] = [];
  currentPassport: TabData | null = null;
  uid: string | null = null;
  downloadPdfLoading: boolean = false;
  downloadExcelLoading: boolean = false;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private passportsTreeService: PassportsTreeService,
    private notificationService: NotificationsService,
    private mapService: MapService,
    private router: Router,
  ) {}

  get name() {
    return this.mapService.panelStateData?.name || '';
  }
  setChipSelection(event: MatChipSelectionChange, idx: number) {
    if (!event.selected) {
      return;
    }
    this.currentPassport = this.calculatedPassportData[idx];
  }
  downLoadPassport(format: 'xlsx' | 'pdf') {
    if (!this.uid) {
      return;
    }
    const reqData: GetPassportFilesReq = {
      uid: this.uid,
      class_name: this.mapService.panelStateData?.type || '',
      format,
    };
    if (format === 'xlsx') {
      this.downloadExcelLoading = true;
    } else {
      this.downloadPdfLoading = true;
    }

    this.mapService
      .downloadPassport(reqData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (format === 'xlsx') {
            this.downloadExcelLoading = false;
          } else {
            this.downloadPdfLoading = false;
          }
        }),
      )
      .subscribe((res) => {
        if (res.error) {
          this.notificationService.displayMessage('Ошибка', 'Ошибка скачивания', 'error');
        } else {
          const a = document.createElement('a');
          a.href = res.result.data.url;
          a.download = this.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
  }
  getPassport() {
    if (!this.uid) {
      return;
    }
    const reqData: GetPassportReq = { uid: this.uid, class_name: this.mapService.panelStateData?.type || '' };
    this.errorCode = null;
    this.errorMessage = null;
    this.loading = true;
    this.mapService
      .getPassport(reqData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((res) => {
        if (!res.error) {
          this.passportData = Object.keys(res.result.data.Table).map(
            (key) => res.result.data.Table[key as keyof typeof res.result.data],
          );
          this.calculateTabsData();
        } else {
          this.errorCode = +res;
          this.errorMessage = String(res);
        }
      });
  }
  openInNewTab(uid: string = '') {
    let url = '';
    if (uid) {
      url = this.router.serializeUrl(this.router.createUrlTree(['/navigator', uid]));
    } else {
      url = this.router.serializeUrl(this.router.createUrlTree(['/navigator', this.uid]));
    }

    window.open(url, '_blank');
  }
  private calculateTabsData() {
    this.calculatedPassportData = this.passportData.map((item) => ({
      label: item['name'],
      displayedColumns: ['№', ...item['columns']],
      data: new TableVirtualScrollDataSource<Array<{ value: any; info: string } | null>>(
        item['value'].map((el, index) => [{ value: index + 1, info: '' }, ...el]),
      ),
    }));
    if (this.calculatedPassportData.length) {
      this.currentPassport = this.calculatedPassportData[0];
    }
  }
  ngOnInit() {
    this.passportsTreeService.selectedUID$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.uid = this.passportsTreeService.selectedUID;
      this.getPassport();
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
