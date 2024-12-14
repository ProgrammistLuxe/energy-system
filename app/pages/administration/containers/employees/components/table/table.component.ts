import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpUserService } from '@api-calls/services';
import { User } from '@api-calls/services/http-user-service/models/user.model';
import { TableOrdering } from '@core/models/table-ordering';
import { QueryParamsService } from '@core/services/query-params.service';
import { getSortDirection } from '@core/utils/get-sort-direction';
import {
  ApiResolverComponent,
  EmptyTemplateComponent,
  LoadingComponent,
  SearchFieldComponent,
} from '@shared/components';
import { materialModules } from '@shared/materials';
import { DefaultPipe } from '@shared/pipes';
import { ReplaySubject, Subject, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'app-employees-table',
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  imports: [
    CommonModule,
    SearchFieldComponent,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matMenuModule,
    materialModules.matTableModule,
    materialModules.matSortModule,
    LoadingComponent,
    EmptyTemplateComponent,
    RouterModule,
    DefaultPipe,
    ApiResolverComponent,
  ],
})
export class EmployeesTableComponent {
  loading = false;
  filter: Record<string, string> = {};
  order: TableOrdering = { column: '', direction: '', string: '' };
  search: string = '';
  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>();
  columns: string[] = [
    'last_name',
    'first_name',
    'middle_name',
    'role',
    'job_title',
    'department',
    'phone',
    'username',
    'is_active',
  ];
  selectedRowId: number | null = null;

  errorCode: number | null = null;
  errorMessage: string | null = null;

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  private update$ = new Subject();

  constructor(
    private queryParamsService: QueryParamsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private httpUserService: HttpUserService,
  ) {}

  openEmployee(id: string) {
    this.router.navigate([id], { queryParamsHandling: 'preserve', relativeTo: this.activatedRoute }).then();
  }

  getData() {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.httpUserService
      .getAuthUsers(this.order.string, this.search)
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (!res.error) {
          this.dataSource.data = res.result;
        } else {
          this.dataSource.data = [];
          this.errorCode = +res;
          this.errorMessage = String(res);
        }
      });
  }

  filterData(data: Record<string, any>) {
    this.filter = data;
    this.update$.next(true);
  }

  parseSort(order: string) {
    if (!order) return;
    if (order[0] === '-') {
      this.order = { string: order, column: order.slice(1), direction: 'desc' };
    } else {
      this.order = { string: order, column: order, direction: 'asc' };
    }
  }

  sortEvent(event: Sort) {
    this.order = {
      column: event.active,
      direction: event.direction,
      string: getSortDirection(event),
    };
    this.router
      .navigate([], {
        queryParams: { order: this.order.string },
        queryParamsHandling: 'merge',
      })
      .then();
  }

  initUpdate() {
    this.update$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getData();
    });
  }

  listenQueryChanges() {
    this.queryParamsService
      .getParams(['order', 'search'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.parseSort(params['order'] ?? '');
        this.search = params['search'] ?? '';
        this.update$.next(true);
      });
  }

  ngOnInit() {
    this.initUpdate();
    this.listenQueryChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
