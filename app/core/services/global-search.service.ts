import { Injectable } from '@angular/core';
import { NotificationsService } from './notifications.service';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';
export interface GlobalSearchData {
  name: string;
  link: string;
  content: string;
}
@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private searchFileUrl: string = 'assets/search/search.json';
  private _fileLoading: boolean = false;
  private searchData: GlobalSearchData[] = [];
  get fileLoading() {
    return this._fileLoading;
  }
  constructor(
    private notificationsService: NotificationsService,
    private http: HttpClient,
  ) {}

  loadSearchFile() {
    this._fileLoading = true;
    this.http
      .get<GlobalSearchData[]>(this.searchFileUrl)
      .pipe(
        catchError(() => of(null)),
        finalize(() => (this._fileLoading = false)),
      )
      .subscribe((res) => {
        if (!res) {
          this.notificationsService.displayMessage('Ошибка', 'Ошибка чтения файла', 'error');
        } else {
          this.searchData = res;
        }
      });
  }
  getSearchedContent(value: string) {
    const searchValue = value.trim().toLowerCase();
    const result = this.searchData.filter((item) => item.content.toLowerCase().includes(searchValue));
    return result;
  }
}
