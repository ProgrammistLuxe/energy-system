import { Injectable } from '@angular/core';
import { finalize, of, switchMap, tap } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { UserAuthService } from './user-auth.service';
import { UserStateService } from './user-state.service';
import { HttpUserService } from '@api-calls/services';
import { OpenObserveModel, OpenObserveService } from './open-observe.service';

@Injectable({
  providedIn: 'root',
})
export class AppInitService {
  constructor(
    private appConfigService: AppConfigService,
    private userAuthService: UserAuthService,
    private userStateService: UserStateService,
    private httpUserService: HttpUserService,
    private openObserver: OpenObserveService,
  ) {}

  init() {
    return new Promise<boolean>((resolve) => {
      this.appConfigService
        .loadConfig()
        .pipe(
          tap((data) => {
            this.appConfigService.config = data;
          }),
          switchMap(() => {
            return this.userAuthService.isAuthValue ? this.httpUserService.getAuthMe() : of(null);
          }),
          finalize(() => {
            resolve(true);
          }),
        )
        .subscribe((response) => {
          if (!response) {
            this.userAuthService.logOut();
            return;
          }
          if (response.error) {
            this.userAuthService.logOut();
            return;
          }
          this.userStateService.user = response.result;
          this.openObserver.user = {
            id: String(response.result.id),
            email: response.result.username,
            name: response.result.first_name || 'anonym',
          };
          this.openObserver.recordingUserInteractionStart();
          if (this.appConfigService.config['PRODUCTION'] === 'true') {
            return;
          }
          this.appConfigService.loadOpenObserveConfig().subscribe((res) => {
            if (res) {
              this.openObserver.config = res as OpenObserveModel;
              this.openObserver.logsInit();
              this.openObserver.recordingInit();
            }
          });
        });
    });
  }
}
