import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DATE_PIPE_FORMAT_LONG } from '@core/consts/date-consts';
import { EmptyTemplateComponent } from '@shared/components';
import { CheckScrollDirective, OverFlowTooltipDirective, CopyContentDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';
import { DefaultPipe } from '@shared/pipes';
import { ReplaySubject, takeUntil } from 'rxjs';
import * as pipes from '../../../../pipes';
import { GetRecordRes } from '@api-calls/services/http-synchronization-journal-service/models';

@Component({
  selector: 'app-logs-table',
  imports: [
    CommonModule,
    materialModules.matTableModule,
    materialModules.matSortModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    pipes.TranslateStatusPipe,
    EmptyTemplateComponent,
    CheckScrollDirective,
    DefaultPipe,
    OverFlowTooltipDirective,
  ],
  templateUrl: './logs-table.component.html',
  styleUrl: './logs-table.component.scss',
})
export class LogsTableComponent {
  @Input() logsList: GetRecordRes[] = [];
  @ViewChild(MatSort) sort: MatSort | undefined;
  dataSource: MatTableDataSource<GetRecordRes> = new MatTableDataSource<GetRecordRes>([]);
  dateFormat = DATE_PIPE_FORMAT_LONG;
  columns: string[] = ['journal_name', 'level', 'log', 'source', 'point', 'extra', 'timestamp', 'added_utc'];
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  ngOnChanges() {
    this.dataSource = new MatTableDataSource<GetRecordRes>(this.logsList);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
