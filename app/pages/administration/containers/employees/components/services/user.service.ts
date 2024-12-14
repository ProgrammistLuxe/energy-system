import { Injectable } from '@angular/core';
import { User } from '@api-calls/services/http-user-service/models/user.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private _user$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  get user$(): BehaviorSubject<User | null> {
    return this._user$;
  }

  get userValue(): User | null {
    return this._user$.value;
  }

  set user(value: User | null) {
    this._user$.next(value);
  }

  set userProperty(property: Record<string, any>) {
    if (this._user$.value) {
      this._user$.next({ ...this._user$.value, ...property });
    }
  }
}
