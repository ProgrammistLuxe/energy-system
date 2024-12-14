import { Injectable } from '@angular/core';
import { JSONRpcRequest } from '@api-calls/api-models';
import { ApiService } from '@api-calls/api/api.service';
import { CreateUser } from './models/user-create.model';
import { UserMe } from './models/user-me.model';
import { UpdateUser } from './models/user-update.model';
import { User } from './models/user.model';

@Injectable({ providedIn: 'root' })
export class HttpUserService {
  constructor(private apiService: ApiService) {}

  getAuthMe() {
    return this.apiService.request<UserMe>(new JSONRpcRequest('GetAuthMe', {}));
  }

  getAuthUsers(ordering?: string, search?: string) {
    return this.apiService.request<User[]>(new JSONRpcRequest('GetAuthUsers', { ordering, search }));
  }

  getAuthUsersById(id: number) {
    return this.apiService.request<User>(new JSONRpcRequest('GetAuthUsersById', { id }));
  }

  putAuthUsersById(user: UpdateUser) {
    return this.apiService.request<User>(new JSONRpcRequest('PutAuthUsersById', { ...user }));
  }

  postAuthUserCreate(user: CreateUser) {
    return this.apiService.request<User>(new JSONRpcRequest('PostAuthUserCreate', { ...user }));
  }
}
