import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  ApiResolverComponent,
  DateRangeControlComponent,
  EmptyTemplateComponent,
  FooterComponent,
} from '@shared/components';
import { materialModules } from '@shared/materials';
import { SynchronizationService } from './services/synchronization.service';
import { PageEvent } from '@angular/material/paginator';
import { NotificationsService } from '@services';
import { ReplaySubject, takeUntil, finalize, BehaviorSubject, forkJoin } from 'rxjs';
import { LogsTableComponent } from './components/logs-table/logs-table.component';
import { GetRecordRes, GetRecordsListReq } from '@api-calls/services/http-synchronization-journal-service/models';
import { FormGroup, FormControl, UntypedFormControl } from '@angular/forms';
import moment from 'moment';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
interface FiltersForm {
  date: FormControl<DateInterval>;
  source: FormControl<string | null>;
  level: FormControl<string | null>;
  journal_name: FormControl<string | null>;
}
interface FiltersFormValue {
  date: DateInterval;
  source: string | null;
  level: string | null;
  journal_name: string | null;
}
interface DateInterval {
  start: moment.Moment;
  end: moment.Moment;
}
@Component({
  selector: 'app-synchronization',
  imports: [
    CommonModule,
    materialModules.matPaginator,
    materialModules.matTableModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matSelectModule,
    materialModules.matFormFieldModule,
    materialModules.matTooltipModule,
    materialModules.matProgressSpinnerModule,
    materialModules.reactiveFormsModule,
    DateRangeControlComponent,
    LogsTableComponent,
    ApiResolverComponent,
    FooterComponent,
    RouterModule,
  ],
  providers: [SynchronizationService],
  templateUrl: './synchronization.component.html',
  styleUrl: './synchronization.component.scss',
})
export class SynchronizationComponent {
  length = 0;
  pageSize = 20;
  pageIndex = 0;
  formInitValue: FiltersFormValue = {
    source: null,
    level: null,
    journal_name: null,
    date: {
      start: moment().startOf('day'),
      end: moment(),
    },
  };

  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  logsList: GetRecordRes[] = [];
  filtersForm = new FormGroup<FiltersForm>({
    date: new FormControl<DateInterval>(
      {
        start: moment().startOf('day'),
        end: moment(),
      },
      { nonNullable: true },
    ),
    source: new FormControl<string | null>(null),
    level: new FormControl<string | null>(null),
    journal_name: new FormControl<string | null>(null),
  });
  levelsList$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  sourcesList$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  journalsList$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private synchronizationService: SynchronizationService,
    private notificationsService: NotificationsService,
  ) {}

  handlePageEvent(e: PageEvent) {
    this.length = e.length;
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.navigateToLogs();
    this.getLogsList();
  }

  applyFilters() {
    this.pageSize = 20;
    this.pageIndex = 0;
    this.navigateToLogs();
    this.getLogsList();
  }
  resetFilters() {
    this.pageSize = 20;
    this.pageIndex = 0;
    this.filtersForm.reset();
    this.navigateToLogs();
    this.getLogsList();
  }
  getLogsList() {
    this.errorCode = null;
    this.errorMessage = null;
    this.loading = true;
    const req: GetRecordsListReq = this.getReqData();
    this.synchronizationService
      .getRecordsList(req)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
        } else {
          this.length = response.result.totalSize;
          this.logsList = response.result.logs;
        }
      });
  }
  private navigateToLogs() {
    this.router.navigate(['./'], {
      relativeTo: this.route,
      queryParams: {
        pageSizeSync: this.pageSize,
        pageIndex: this.pageIndex,
        source: this.filtersForm.get('source')?.value,
        level: this.filtersForm.get('level')?.value,
        journal_name: this.filtersForm.get('journal_name')?.value,
        date_from: this.filtersForm.get('date')?.value?.start?.toISOString(),
        date_to: this.filtersForm.get('date')?.value?.end?.toISOString(),
      },
    });
  }
  private getReqData() {
    const req: GetRecordsListReq = {
      offset: this.pageIndex * this.pageSize,
      limit: this.pageSize,
    };
    const value = this.filtersForm.value;
    if (value.date) {
      req.date_from = value.date.start?.toISOString();
      req.date_to = value.date.end?.toISOString();
    }
    if (value.source) {
      req.source = value.source;
    }
    if (value.level) {
      req.level = value.level;
    }
    if (value.journal_name) {
      req.level = value.journal_name;
    }
    return req;
  }
  private loadParams() {
    const pageSize = this.route.snapshot.queryParamMap.get('pageSize');
    const pageIndex = this.route.snapshot.queryParamMap.get('pageIndex');
    const source = this.route.snapshot.queryParamMap.get('source');
    const level = this.route.snapshot.queryParamMap.get('level');
    const journal_name = this.route.snapshot.queryParamMap.get('journal_name');
    const date_to = this.route.snapshot.queryParamMap.get('date_to');
    const date_from = this.route.snapshot.queryParamMap.get('date_from');
    if (pageSize) {
      this.pageSize = +pageSize;
    }
    if (pageIndex) {
      this.pageIndex = +pageIndex;
    }

    this.formInitValue = {
      source: source,
      level: level,
      journal_name: journal_name,
      date: {
        start: date_from ? moment(date_from) : moment().startOf('day'),
        end: date_to ? moment(date_to) : moment(),
      },
    };
  }
  private getInitialFiltersData() {
    forkJoin([
      this.synchronizationService.getLevelsList(),
      this.synchronizationService.getSourceList(),
      this.synchronizationService.getJournalNames(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe((responses) => {
        if (responses[0].error) {
          const message = getErrorsMessage(responses[0].error) || 'Ошибка получения списка видов записей';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
        } else {
          this.levelsList$.next(responses[0].result.levels);
        }
        if (responses[1].error) {
          const message = getErrorsMessage(responses[1].error) || 'Ошибка получения списка источников';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
        } else {
          this.sourcesList$.next(responses[1].result.sources);
        }
        if (responses[2].error) {
          const message = getErrorsMessage(responses[2].error) || 'Ошибка получения списка журналов';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
        } else {
          this.journalsList$.next(responses[2].result.journal_names);
        }
        this.filtersForm.setValue(this.formInitValue);
        this.getLogsList();
      });
  }
  ngOnInit() {
    this.loadParams();
    this.getInitialFiltersData();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
