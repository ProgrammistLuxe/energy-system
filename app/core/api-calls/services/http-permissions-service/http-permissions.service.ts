import { Injectable } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { JSONRpcRequest } from '@api-calls/api-models';
import { Permission } from './models/permission';

@Injectable({ providedIn: 'root' })
export class HttpRolePermissionsService {
  constructor(private apiService: ApiService) {}
  getAuthPermissions() {
    return this.apiService.request<Permission[]>(new JSONRpcRequest('GetAuthPermissions', {}));
  }
}
