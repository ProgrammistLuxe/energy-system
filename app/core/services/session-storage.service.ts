import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
function getSessionStorage(): Storage {
  return sessionStorage;
}
@Injectable({
  providedIn: 'root',
})
export class SessionStorageService {
  private _SessionStorage: Storage;

  constructor() {
    this._SessionStorage = getSessionStorage();
    this.load();
  }

  private _storage$ = new BehaviorSubject<{ [index: string]: any } | null>(null);
  public storage$ = this._storage$.asObservable();

  public set(key: string, value: any): void {
    if (value !== this.get(key)) {
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      this._SessionStorage.setItem(key, value);
      this.load();
    }
  }

  public get(key: string): any {
    let data = this._SessionStorage.getItem(key);
    try {
      if (!data) {
        return;
      }
      data = JSON.parse(data);
    } catch (e) {}
    return data;
  }

  public delete(key: string): void {
    if (this.get(key)) {
      this._SessionStorage.removeItem(key);
      this.load();
    }
  }

  public deleteAll() {
    this._SessionStorage.clear();
    this.load();
  }

  public watch(key: string): Observable<any> {
    return this.storage$.pipe(
      map((data) => data?.[key]),
      distinctUntilChanged(),
    );
  }

  private load() {
    const storage: { [index: string]: any } = {};
    const keys = Object.keys(this._SessionStorage);
    let i = keys.length;
    while (i--) {
      let data = this._SessionStorage.getItem(keys[i]);
      if (!data) {
        return;
      }
      try {
        data = JSON.parse(data);
        storage[keys[i]] = data;
      } catch (e) {
        storage[keys[i]] = data;
      }
    }
    this._storage$.next(storage);
  }
}
