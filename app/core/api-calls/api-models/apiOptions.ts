import { HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';

export interface ApiOptions {
  headers?:
    | HttpHeaders
    | {
        [header: string]: string | string[];
      };
  context?: HttpContext;
  observe?: string;
  params?:
    | HttpParams
    | {
        [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
      };
  reportProgress?: boolean;
  responseType?: string;
  withCredentials?: boolean;
}
