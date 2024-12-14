import { Injectable } from '@angular/core';
import { JSONRpcRequest } from '@api-calls/api-models';
import { ApiService } from '@api-calls/api/api.service';
import { UserAuthJWTResponse } from './models/auth-jwt-response.model';

@Injectable({ providedIn: 'root' })
export class HttpAuthService {
  constructor(private apiService: ApiService) {}

  postAuthJwtCreate(username: string, password: string) {
    return this.apiService.request<UserAuthJWTResponse>(
      new JSONRpcRequest('PostAuthJwtCreate', { username, password }),
    );
  }
  PostUserJwtRefresh(refresh: string) {
    return this.apiService.request<UserAuthJWTResponse>(new JSONRpcRequest('PostUserJwtRefresh', { refresh }));
  }

  postAuthResetPasswordConfirm(uid: string, token: string, new_password: string) {
    return this.apiService.request<UserAuthJWTResponse>(
      new JSONRpcRequest('PostAuthResetPasswordConfirm', { uid, token, new_password }),
    );
  }

  postAuthChangePassword(current_password: string, new_password: string) {
    return this.apiService.request(new JSONRpcRequest('PostAuthChangePassword', { current_password, new_password }));
  }
}
