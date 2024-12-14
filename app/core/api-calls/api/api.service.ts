import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorageService } from '@services';
import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiError, ApiResponse, ApiResponseError, ApiResponseSuccess } from '../api-models';
import { AppConfigService } from '@services';
import { JSONRpcRequest } from '@api-calls/api-models/request';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private localStorageService: LocalStorageService,
    private appConfigService: AppConfigService,
  ) {}
  saveToMinioRequest<T>(bucket: string, name: string, data: FormData) {
    const httpOptions = {
      headers: {
        'Content-Type': 'text/plain',
      },
    };
    const host = 'https://syspass-minio.intechs.by';
    const url = `${host}/${bucket}/${name}`;
    return this.httpClient.put(url, data.get('file'), httpOptions).pipe(
      map((data) => {
        return new ApiResponseSuccess({ result: <T>data, error: null });
      }),
      catchError((err: any) => {
        return of(new ApiResponseError(this.mapError(err)));
      }),
    );
  }
  getFromMinio<T>(bucket: string, name: string) {
    const host = 'https://syspass-minio.intechs.by';
    const url = `${host}/${bucket}/${name}`;
    return this.httpClient.get(url, { responseType: 'text' }).pipe(
      map((data) => {
        return new ApiResponseSuccess({ result: <T>data, error: null });
      }),
      catchError((err: any) => {
        return of(new ApiResponseError(this.mapError(err)));
      }),
    );
  }
  getFromMinioByUrl<T>(url: string) {
    return this.httpClient
      .get(url, {
        responseType: 'blob',
      })
      .pipe(
        map((data) => {
          return new ApiResponseSuccess({ result: <T>data, error: null });
        }),
        catchError((err: any) => {
          return of(new ApiResponseError(this.mapError(err)));
        }),
      );
  }
  request<T>(req: JSONRpcRequest): Observable<ApiResponse<T>> {
    const path = req.path();
    const url = this.getFullUrl(path);

    const body = req.requestObject();
    const httpOptions = this.headers(req.headers);

    return this.httpClient.post<ApiResponse<T>>(url, body, httpOptions).pipe(
      map((data) => {
        return new ApiResponseSuccess({ result: <T>data, error: null });
      }),
      catchError((err: any) => {
        return of(new ApiResponseError(this.mapError(err)));
      }),
    );
  }

  private getFullUrl(url: string) {
    return this.appConfigService.config['BASE_API_URL'] + '/rpc' + url;
  }

  private headers(headers: Record<string, any> | null = null) {
    const token = this.localStorageService.get('access');
    const httpOptions = {
      headers: new HttpHeaders(),
    };
    httpOptions.headers = httpOptions.headers.append('Content-Type', 'application/json');
    if (token) {
      httpOptions.headers = httpOptions.headers.append('Authorization', 'JWT ' + token);
    }
    if (headers) {
      Object.entries(headers).forEach((entry) => {
        httpOptions.headers = httpOptions.headers.append(entry[0], entry[1]);
      });
    }
    return httpOptions;
  }

  private mapError(data: any): ApiResponseError {
    if (!(data instanceof HttpErrorResponse)) {
      return {
        result: null,
        error: data,
        [Symbol.toPrimitive]: () => null,
      };
    }
    let error: ApiError = data.error;
    const badReq = [500, 0];
    if (badReq.includes(data.status)) {
      const detail = data.error?.message || 'Ошибка отправки запроса - API недоступно';
      error = {
        type: 'error',
        errors: [
          {
            code: '0',
            detail,
            attr: '',
          },
        ],
      };
    }
    return {
      result: null,
      error: error,
      [Symbol.toPrimitive]: () => null,
    };
  }
}
