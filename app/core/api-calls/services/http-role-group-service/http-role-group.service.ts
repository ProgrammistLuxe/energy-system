import { Injectable } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { JSONRpcRequest } from '@api-calls/api-models';
import { PostUserGroup } from './models/post-user-group';
import { GetUserGroup } from './models/get-user-group';
import { User } from '@api-calls/services/http-user-service/models/user.model';

@Injectable({ providedIn: 'root' })
export class HttpRoleGroupService {
  constructor(private apiService: ApiService) {}

  getAuthGroups() {
    return this.apiService.request<GetUserGroup[]>(new JSONRpcRequest('GetAuthGroups', {}));
  }
  getAuthGroupsById(id: number) {
    return this.apiService.request<GetUserGroup>(new JSONRpcRequest('GetAuthGroupsById', { id }));
  }
  postAuthGroups(body: PostUserGroup) {
    return this.apiService.request<GetUserGroup>(new JSONRpcRequest('PostAuthGroups', { ...body }));
  }
  putAuthGroupsById(id: number, body: PostUserGroup) {
    return this.apiService.request<GetUserGroup>(new JSONRpcRequest('PutAuthGroupsById', { id, ...body }));
  }
  deleteAuthGroupsById(id: number) {
    return this.apiService.request(new JSONRpcRequest('DeleteAuthGroupsById', { id }));
  }
  GetAuthGroupsByIdGetUsers(id: number) {
    return this.apiService.request<User[]>(new JSONRpcRequest('GetAuthGroupsByIdGetUsers', { id }));
  }
  postAuthGroupsByIdSetUsers(id: number, users: number[]) {
    return this.apiService.request(new JSONRpcRequest('PostAuthGroupsByIdSetUsers', { id, users }));
  }
}
