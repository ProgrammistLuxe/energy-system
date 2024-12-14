import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { UserStateService } from './user-state.service';
import { UserAuthJWTResponse } from '@api-calls/services/http-auth-service/models/auth-jwt-response.model';

@Injectable({ providedIn: 'root' })
export class UserAuthService {
  constructor(
    private localStorageService: LocalStorageService,
    private userStateService: UserStateService,
  ) {
    this.loadToken();
  }

  private _isAuth$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public get isAuth$(): Observable<boolean> {
    return this._isAuth$.asObservable();
  }

  public get isAuthValue() {
    return this._isAuth$.value;
  }

  private set isAuth(value: boolean) {
    this._isAuth$.next(value);
  }

  public login(tokens: UserAuthJWTResponse) {
    this.localStorageService.set('access', tokens.access);
    this.localStorageService.set('refresh', tokens.refresh);
    this.isAuth = true;
  }

  public logOut() {
    this.localStorageService.delete('access');
    this.localStorageService.delete('refresh');
    this.userStateService.user = null;
    this.isAuth = false;
  }

  public loadToken() {
    const token = this.localStorageService.get('access');
    if (token) {
      this.isAuth = true;
    }
  }
}
