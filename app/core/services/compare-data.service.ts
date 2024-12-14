import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CompareDataService {
  private currentValue$: BehaviorSubject<any> | null = null;
  private startValue: any = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private _isTheSame: boolean = true;
  private keyForSorting: string = 'id';
  get isTheSame(): boolean {
    return this._isTheSame;
  }

  registerValues(startValue: any, currentValue$: BehaviorSubject<any>, keyForSorting?: string) {
    if (keyForSorting) {
      this.keyForSorting = keyForSorting;
    }
    this.currentValue$ = currentValue$;
    this.startValue = structuredClone(startValue);
    this._isTheSame = this.compareValues();
    this.initSubs();
  }
  private initSubs() {
    if (!this.currentValue$) {
      return;
    }
    this.currentValue$
      .asObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this._isTheSame = this.compareValues();
      });
  }
  private compareValues() {
    if (!this.currentValue$) {
      return false;
    }
    if (this.startValue === null && this.currentValue$.value === null) {
      return true;
    }
    if (typeof this.startValue !== typeof this.currentValue$.value) {
      return false;
    }
    if (Array.isArray(this.startValue) && Array.isArray(this.currentValue$.value)) {
      return (
        JSON.stringify(this.sortedArray(this.currentValue$.value)) === JSON.stringify(this.sortedArray(this.startValue))
      );
    }
    const isObjects =
      this.currentValue$.value !== null &&
      typeof this.currentValue$.value === 'object' &&
      this.startValue !== null &&
      typeof this.startValue === 'object';
    if (isObjects) {
      return (
        JSON.stringify(this.sortedObject(this.startValue)) ===
        JSON.stringify(this.sortedObject(this.currentValue$.value))
      );
    }
    return JSON.stringify(this.startValue) === JSON.stringify(this.currentValue$.value);
  }
  private sortedArray(list: Array<any>) {
    if (!list.length) {
      return list;
    }
    if (list[0][this.keyForSorting]) {
      return list.sort((a, b) => a[this.keyForSorting] - b[this.keyForSorting]);
    }

    return list.sort();
  }
  private sortedObject(item: Record<string, any>) {
    const sortedObject: Record<string, any> = {};
    const keys = Object.keys(item);
    keys.sort().forEach((key) => {
      if (Array.isArray(item[key])) {
        Object.assign(sortedObject, { [key]: this.sortedArray(item[key]) });
        return;
      }
      if (item[key] !== null && typeof item[key] === 'object') {
        const calculatedObject = this.sortedObject(item[key]);
        Object.assign(sortedObject, { [key]: calculatedObject });
        return;
      }
      Object.assign(sortedObject, { [key]: item[key] });
    });
    return sortedObject;
  }
  private onDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
