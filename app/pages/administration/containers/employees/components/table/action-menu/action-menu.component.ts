import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QueryParamsService } from '@core/services/query-params.service';
import { SearchFieldComponent } from '@shared/components';
import { materialModules } from '@shared/materials';
import { BehaviorSubject, ReplaySubject, Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'app-action-menu',
  imports: [CommonModule, SearchFieldComponent, materialModules.matIconModule, materialModules.matMenuModule],
  templateUrl: './action-menu.component.html',
  styleUrl: './action-menu.component.scss',
})
export class ActionMenuComponent {
  search$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private debounceTime: number = 0;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private queryParamsService: QueryParamsService,
  ) {}

  searchTable(search: string) {
    this.router
      .navigate([], {
        queryParams: { search },
        queryParamsHandling: 'merge',
      })
      .then();
  }

  createEmployee() {
    this.router.navigate(['create'], { queryParamsHandling: 'preserve', relativeTo: this.activatedRoute });
  }
  private createSearchSub() {
    this.search$.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe((value) => {
      this.router
        .navigate([], {
          queryParams: { search: value },
          queryParamsHandling: 'merge',
        })
        .then();
    });
  }

  ngOnInit() {
    this.queryParamsService
      .getParams(['search'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.search$.next(params['search'] ?? '');
      });
  }

  ngAfterViewInit() {
    const stopper$: ReplaySubject<void> = new ReplaySubject<void>();
    this.search$.pipe(takeUntil(stopper$)).subscribe((value) => {
      this.createSearchSub();
      this.router
        .navigate([], {
          queryParams: { search: value },
          queryParamsHandling: 'merge',
        })
        .then();
    });
    stopper$.next();
    stopper$.complete();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
