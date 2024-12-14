import { Injectable } from '@angular/core';

import { openobserveLogs } from '@openobserve/browser-logs';
import { RumInitConfiguration, openobserveRum } from '@openobserve/browser-rum';
import { BehaviorSubject } from 'rxjs';
export interface OpenObserveModel {
  clientToken: string;
  applicationId: string;
  site: string;
  service: string;
  env: string;
  version: string;
  organizationIdentifier: string;
  insecureHTTP: boolean;
  apiVersion: string;
}
export interface OpenObserveUserModel {
  id: string;
  name: string;
  email: string;
}

/**
 * {Сервис отправки метрик, ошибок и т.д. https://openobserve.ai/docs/}
 *
 * @class OpenObserveService
 * @typedef {OpenObserveService}
 */
@Injectable({ providedIn: 'root' })
export class OpenObserveService {
  /**
   * {GLOBAL CONFIG }
   *
   * @private
   * @type {OpenObserveModel | null}
   */
  private _config: OpenObserveModel | null = null;

  /**
   * {USER DATA FOR IDENTIFICATE USER IN ADMIN PANEL}
   *
   * @private
   * @type {OpenObserveUserModel | null}
   */
  private _user: OpenObserveUserModel | null = null;
  /**
   * {Recording flag}
   *
   * @private
   * @type {Boolean}
   */
  private _recording$ = new BehaviorSubject<boolean>(false);
  recording$ = this._recording$.asObservable();

  set config(config: OpenObserveModel) {
    this._config = config;
  }
  get config(): OpenObserveModel | null {
    return this._config;
  }

  set user(newUser: OpenObserveUserModel | null) {
    this._user = newUser;
    const user = this.getValidUserConfig();
    openobserveRum.removeUser();
    openobserveRum.setUser({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }
  get user(): OpenObserveUserModel | null {
    return this._user;
  }
  recordingInit() {
    const config = this.getValidConfig();
    const user = this.getValidUserConfig();
    openobserveRum.init({
      ...config,
    });
    openobserveRum.setUser({
      ...user,
    });
    openobserveRum.startSessionReplayRecording();
  }
  recordingUserInteractionStart() {
    this.trackUserInteractions(true);
  }
  recordingUserInteractionStop() {
    this.trackUserInteractions(false);
  }

  logsInit() {
    const config = this.getValidConfig();
    openobserveLogs.init({
      clientToken: config.clientToken,
      site: config.site,
      organizationIdentifier: config.organizationIdentifier,
      service: config.service,
      env: config.env,
      version: config.version,
      forwardErrorsToLogs: true,
      insecureHTTP: config.insecureHTTP,
      apiVersion: config.apiVersion,
    });
  }
  private getValidConfig(): RumInitConfiguration {
    return {
      clientToken: this.config?.clientToken ?? '',
      applicationId: this.config?.applicationId ?? '',
      site: this.config?.site ?? '',
      service: this.config?.service ?? '',
      env: this.config?.env ?? '',
      version: this.config?.version ?? '',
      organizationIdentifier: this.config?.organizationIdentifier ?? '',
      insecureHTTP: this.config?.insecureHTTP ?? false,
      apiVersion: this.config?.apiVersion ?? '',
      trackResources: true,
      trackLongTasks: true,
      trackUserInteractions: false,
    };
  }
  private getValidUserConfig(): OpenObserveUserModel {
    return {
      id: this._user?.id ?? '0',
      name: this._user?.name ?? 'anonim',
      email: this._user?.email ?? 'anonim@example.com',
    };
  }
  private trackUserInteractions(value: boolean) {
    const config = this.getValidConfig();
    openobserveRum.stopSessionReplayRecording();
    openobserveRum.init({
      ...config,
      trackUserInteractions: value,
    });
    openobserveRum.startSessionReplayRecording();
    this._recording$.next(value);
  }
}
