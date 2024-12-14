import { Injectable } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { distinctUntilChanged, filter, map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QueryParamsService {
  constructor(private activatedRoute: ActivatedRoute) {}

  public getParams(params: string[]): Observable<Params> {
    return this.activatedRoute.queryParams.pipe(
      filter((params) => !!Object.keys(params).length),
      map((queryParams) => {
        const filteredParams: Record<string, unknown> = {};
        params.forEach((param) => {
          filteredParams[param] = queryParams[param] ?? null;
        });
        return filteredParams;
      }),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    );
  }
}
