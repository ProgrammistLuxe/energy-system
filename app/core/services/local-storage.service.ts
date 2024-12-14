import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

function getLocalStorage(): Storage {
  return localStorage;
}

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private _LocalStorage: Storage;

  constructor() {
    this._LocalStorage = getLocalStorage();
    this.load();
    this.windowWatch();
  }

  private _storage$ = new BehaviorSubject<{ [index: string]: any } | null>(null);

  public storage$ = this._storage$.asObservable();

  public set(key: string, value: any): void {
    if (value !== this.get(key)) {
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      this._LocalStorage.setItem(key, value);
      this.load();
    }
  }

  public get(key: string): any {
    let data = this._LocalStorage.getItem(key) ?? '';
    try {
      data = JSON.parse(data);
    } catch (e) {}
    return data;
  }

  public delete(key: string): void {
    this._LocalStorage.removeItem(key);
    this.load();
  }

  public deleteAll() {
    this._LocalStorage.clear();
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
    const keys = Object.keys(this._LocalStorage);
    let i = keys.length;
    while (i--) {
      let data = this._LocalStorage.getItem(keys[i]);
      try {
        data = JSON.parse(this._LocalStorage.getItem(keys[i]) ?? '');
        storage[keys[i]] = data;
      } catch (e) {
        storage[keys[i]] = data;
      }
    }
    this._storage$.next(storage);
  }

  private windowWatch() {
    window.addEventListener(
      'storage',
      (event) => {
        if (event.newValue !== event.oldValue) {
          this.load();
        }
      },
      false,
    );
  }
}
