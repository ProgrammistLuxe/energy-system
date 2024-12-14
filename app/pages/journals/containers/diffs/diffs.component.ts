import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  ApiResolverComponent,
  DialogService,
  EmptyTemplateComponent,
  FooterComponent,
  materialModules,
} from '@shared/index';
import { Observable, ReplaySubject, filter, finalize, interval, takeUntil } from 'rxjs';
import { DiffsService } from './services/diffs.service';
import { DiffsTableComponent } from './components/diffs-table/diffs-table.component';
import { GetDiffRes } from '@api-calls/services/http-diff-service/models';
import { AddDiffModalComponent } from './components/add-diff-modal/add-diff-modal.component';
import { LocalStorageService } from '@services';

interface IntervalOption {
  time: number;
  name: string;
}
const DIFFS_REQUEST_INTERVAL_KEY: string = 'diffsRequestIntervalTime';
@Component({
  selector: 'app-diffs',
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
    ApiResolverComponent,
    EmptyTemplateComponent,
    DiffsTableComponent,
    FooterComponent,
    RouterModule,
  ],
  providers: [DiffsService],
  templateUrl: './diffs.component.html',
  styleUrl: './diffs.component.scss',
})
export class DiffsComponent {
  length = 0;
  pageSize = 20;
  pageIndex = 0;
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  diffList: GetDiffRes[] = [];
  intervalOptions: IntervalOption[] = [
    {
      time: 0,
      name: 'Выключить',
    },
    {
      time: 10000,
      name: '10 секунд',
    },
    {
      time: 30000,
      name: '30 секунд',
    },
    {
      time: 60000,
      name: '1 минута',
    },
    {
      time: 300000,
      name: '5 минут',
    },
    {
      time: 900000,
      name: '15 минут',
    },
    {
      time: 1800000,
      name: '30 минут',
    },
  ];
  intervalValue: number = 0;
  progressValue: number = 0;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private stop$: ReplaySubject<void> = new ReplaySubject<void>();
  private interval$: Observable<number> | null = null;
  private progressInterval$: Observable<number> | null = null;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private diffsService: DiffsService,
    private dialogService: DialogService,
    private localStorageService: LocalStorageService,
  ) {}

  handlePageEvent(e: PageEvent) {
    this.length = e.length;
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.navigateToDiffs();
    this.getDiffList();
  }
  navigateToDiffs() {
    this.router.navigate(['./'], {
      relativeTo: this.route,
      queryParams: { pageSize: this.pageSize, pageIndex: this.pageIndex },
    });
  }
  getDiffList() {
    this.errorCode = null;
    this.errorMessage = null;
    this.loading = true;
    this.diffsService
      .loadDiffList(this.pageSize, this.pageIndex)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.progressValue = 0;
        }),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
        } else {
          this.length = response.result.total;
          this.diffList = response.result.items;
        }
      });
  }
  addDiff() {
    const dialogTemplate = this.dialogService.open<AddDiffModalComponent>(AddDiffModalComponent, {
      title: 'Загрузить diff',
      width: '400px',
    });
    dialogTemplate
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.getDiffList();
      });
  }
  setRequestInterval(intervalTime: number) {
    this.stop$.next();
    this.stop$.complete();
    this.interval$ = null;
    this.progressValue = 0;
    this.localStorageService.set(DIFFS_REQUEST_INTERVAL_KEY, intervalTime);
    if (!intervalTime) {
      return;
    }
    this.intervalValue = intervalTime;
    this.stop$ = new ReplaySubject<void>();
    this.interval$ = interval(intervalTime);
    this.interval$.pipe(takeUntil(this.stop$)).subscribe(() => {
      this.getDiffList();
    });
    const step = 100 / (this.intervalValue / 100);
    this.progressInterval$ = interval(100);
    this.progressInterval$.pipe(takeUntil(this.stop$)).subscribe((index) => {
      this.progressValue += step;
      if (this.progressValue >= 100) {
        this.progressValue = 100;
      }
    });
  }

  private loadParams() {
    const pageSize = this.route.snapshot.queryParamMap.get('pageSize');
    const pageIndex = this.route.snapshot.queryParamMap.get('pageIndex');
    if (pageSize) {
      this.pageSize = +pageSize;
    }
    if (pageIndex) {
      this.pageIndex = +pageIndex;
    }
  }
  ngOnInit() {
    this.loadParams();
    this.getDiffList();
    this.intervalValue = this.localStorageService.get(DIFFS_REQUEST_INTERVAL_KEY) || 0;
    this.setRequestInterval(this.intervalValue);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stop$.next();
    this.stop$.complete();
  }
}
