import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { GetDiffRes } from '@api-calls/services/http-diff-service/models';
import {
  CheckScrollDirective,
  CopyContentDirective,
  DefaultPipe,
  EmptyTemplateComponent,
  OverFlowTooltipDirective,
  materialModules,
} from '@shared/index';
import { DATE_PIPE_FORMAT_LONG } from '@consts/date-consts';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ReplaySubject, takeUntil } from 'rxjs';
import { NotificationsService } from '@services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { HttpMinioService } from '@api-calls/services';
import * as pipes from '../../../../pipes';
import { downloadData } from '@core/utils/download-data';
@Component({
  selector: 'app-diffs-table',
  imports: [
    CommonModule,
    materialModules.matTableModule,
    materialModules.matSortModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    pipes.ConvertBlocksPipe,
    pipes.ConvertBytesPipe,
    pipes.ConvertMicrosecondsPipe,
    pipes.TranslateStatusPipe,
    EmptyTemplateComponent,
    CheckScrollDirective,
    DefaultPipe,
    OverFlowTooltipDirective,
    CopyContentDirective,
  ],
  templateUrl: './diffs-table.component.html',
  styleUrl: './diffs-table.component.scss',
})
export class DiffsTableComponent {
  @Input() diffList: GetDiffRes[] = [];
  @ViewChild(MatSort) sort: MatSort | undefined;
  dataSource: MatTableDataSource<GetDiffRes> = new MatTableDataSource<GetDiffRes>([]);
  dateFormat = DATE_PIPE_FORMAT_LONG;
  columns: string[] = [
    'id',
    'object_name',
    'description',
    'status',
    'date_created',
    'date_updated',
    'size',
    'mem_peak',
    'mem_size',
    'timedelta',
    'download',
  ];
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private httpMinioService: HttpMinioService,
    private notificationService: NotificationsService,
  ) {}
  downloadFromMinio(name: string) {
    this.httpMinioService
      .getFromMinio('diffs', name)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (response.error) {
          const message = getErrorsMessage(response.error) || 'Ошибка скачивания';
          this.notificationService.displayMessage('Ошибка', message, 'error');
          return;
        }
        downloadData(response.result, name, 'application/xml');
      });
  }
  ngOnChanges() {
    this.dataSource = new MatTableDataSource<GetDiffRes>(this.diffList);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
