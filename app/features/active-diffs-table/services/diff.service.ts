import { Injectable } from '@angular/core';
import { ApiResponse } from '@api-calls/api-models';
import { HttpDiffService } from '@api-calls/services/http-diff-service/http-diff.service';
import { GetDiffRes, PostDiffReq } from '@api-calls/services/http-diff-service/models';
import { BehaviorSubject, Observable, ReplaySubject, interval, forkJoin, of, switchMap, takeUntil } from 'rxjs';
import { NotificationsService } from '@core/services/notifications.service';
import { HttpMinioService } from '@api-calls/services';

export interface DiffItem {
  schema_uid?: string | null;
  place_name: string;
  diff_id: number;
  diff_name: string;
}
@Injectable({
  providedIn: 'root',
})
export class DiffService {
  constructor(
    private httpMinioService: HttpMinioService,
    private httpDiffService: HttpDiffService,
    private notificationsService: NotificationsService,
  ) {
    this.trackDiffStatusChanges();
  }
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private stop$: ReplaySubject<void> = new ReplaySubject<void>();
  private _diffList$: BehaviorSubject<DiffItem[]> = new BehaviorSubject<DiffItem[]>([]);
  private interval$: Observable<number> | null = null;
  private errorMessagesCounts: { [key: string]: number } | null = null;
  get diffList(): DiffItem[] {
    return this._diffList$.value;
  }
  insertIntoDiffList(value: DiffItem) {
    this._diffList$.next([...this.diffList, value]);
  }
  deleteFromDiffList(id: number) {
    const diffList = this.diffList.filter((diff) => diff.diff_id !== id);
    this._diffList$.next(diffList);
  }
  async saveDiff(diff: string) {
    const blob = new Blob([diff], { type: 'text/xml;charset=UTF-8' });
    const formData = new FormData();
    const encoder = new TextEncoder();
    const data = encoder.encode(diff);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => ('0' + b.toString(16)).slice(-2)).join('');

    const fileName = `${hashHex}.xml`;
    formData.append('file', blob, fileName);
    return this.httpMinioService.saveToMinio('diffs', fileName, formData).pipe(
      takeUntil(this.destroy$),
      switchMap((response) => {
        if (response.error) {
          return of(null);
        }
        const reqData: PostDiffReq = {
          object_name: fileName,
          bucket_name: 'diffs',
          description: null,
        };
        return this.httpDiffService.postGraphDiffAsync([reqData]);
      }),
    );
  }
  getDiffId(id: number) {
    return this.httpDiffService.getGraphDiffDiffIdStatus(id);
  }
  private createInterval() {
    this.errorMessagesCounts = null;
    this.interval$ = interval(5000);
    this.stop$ = new ReplaySubject<void>();
    this.interval$.pipe(takeUntil(this.stop$)).subscribe(() => {
      this.requestDiffs();
    });
  }
  private requestDiffs() {
    const responses: Observable<ApiResponse<GetDiffRes>>[] = this.diffList.map((diff) => this.getDiffId(diff.diff_id));
    forkJoin(responses)
      .pipe(takeUntil(this.destroy$))
      .subscribe((responses) => {
        responses.forEach((res) => {
          if (res.error) {
            return;
          }

          if (!this.errorMessagesCounts?.[res.result.id]) {
            this.errorMessagesCounts = {
              ...(this.errorMessagesCounts || {}),
              [`${res.result.id}`]: 1,
            };
          }
          const current_diff = this.diffList.find((diff) => diff.diff_id === res.result.id);
          if (!current_diff) {
            return;
          }
          switch (res.result.status) {
            case 'error': {
              if (this.errorMessagesCounts[res.result.id] > 1) {
                return;
              }
              this.notificationsService.displayMessage(
                'Ошибка',
                `При применении diff ${res.result.object_name} возникла ошибка`,
                'error',
                3000,
              );
              this.errorMessagesCounts[res.result.id] = this.errorMessagesCounts[res.result.id] + 1;
              break;
            }
            case 'applied': {
              this.notificationsService.displayMessage(
                'Успешно',
                `Diff ${res.result.object_name} успешно применен`,
                'success',
                3000,
              );
              this.deleteFromDiffList(current_diff.diff_id);
              break;
            }
            case 'waiting':
              break;
          }
        });
      });
  }
  private trackDiffStatusChanges() {
    this._diffList$.asObservable().subscribe((list) => {
      if (!list.length) {
        this.stop$.next();
        this.interval$ = null;
        return;
      }
      if (!this.interval$) {
        this.createInterval();
        return;
      }
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.stop$.next();
    this.stop$.complete();
    this.destroy$.complete();
  }
}
