import { Injectable } from '@angular/core';
import { UserMe } from '@api-calls/services/http-user-service/models/user-me.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  private _user$: BehaviorSubject<UserMe | null> = new BehaviorSubject<UserMe | null>(null);
  public get user$() {
    return this._user$.asObservable();
  }

  public get userValue(): UserMe | null {
    return this._user$.value;
  }

  public set user(user: UserMe | null) {
    this._user$.next(user);
  }
}
