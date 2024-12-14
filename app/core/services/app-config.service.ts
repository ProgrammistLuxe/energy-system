import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private _config: Record<string, any> = {};

  constructor(private http: HttpClient) {}

  get config(): Record<string, any> {
    return this._config;
  }
  set config(data: Record<string, any>) {
    this._config = data;
  }
  loadConfig() {
    return this.http.get('/assets/app-config.json');
  }
  loadOpenObserveConfig() {
    return this.http.get('/assets/open-observe.json');
  }
}
