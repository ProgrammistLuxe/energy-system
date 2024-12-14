import { Injectable } from '@angular/core';
import { HttpRoleGroupService, HttpRolePermissionsService, HttpUserService } from '@api-calls/services';
import { Permission } from '@api-calls/services/http-permissions-service/models/permission';
import { GetUserGroup } from '@api-calls/services/http-role-group-service/models/get-user-group';
import { PostUserGroup } from '@api-calls/services/http-role-group-service/models/post-user-group';
import { User } from '@api-calls/services/http-user-service/models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoleGroupsService {
  selectedPermissions$: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
  selectedUsers$: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
  groupList$: BehaviorSubject<GetUserGroup[]> = new BehaviorSubject<GetUserGroup[]>([]);
  private _currentGroupId$: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(null);
  get currentGroupId(): number | null {
    return this._currentGroupId$.value;
  }
  set currentGroupId(value: number | null) {
    this._currentGroupId$.next(value);
  }
  get currentGroupId$(): Observable<number | null> {
    return this._currentGroupId$.asObservable();
  }

  constructor(
    private httpRoleGroupsService: HttpRoleGroupService,
    private httpUserService: HttpUserService,
    private httpPermissionsService: HttpRolePermissionsService,
  ) {}

  getAuthGroups() {
    return this.httpRoleGroupsService.getAuthGroups();
  }
  getAuthGroupsById(id: number) {
    return this.httpRoleGroupsService.getAuthGroupsById(id);
  }
  postAuthGroups(body: PostUserGroup) {
    return this.httpRoleGroupsService.postAuthGroups(body);
  }
  putAuthGroupsById(id: number, body: PostUserGroup) {
    return this.httpRoleGroupsService.putAuthGroupsById(id, body);
  }
  deleteAuthGroupsById(id: number) {
    return this.httpRoleGroupsService.deleteAuthGroupsById(id);
  }
  getAuthGroupsByIdGetUsers(id: number) {
    return this.httpRoleGroupsService.GetAuthGroupsByIdGetUsers(id);
  }
  getAuthUsers() {
    return this.httpUserService.getAuthUsers();
  }
  postAuthGroupsByIdSetUsers(id: number, users: number[]) {
    return this.httpRoleGroupsService.postAuthGroupsByIdSetUsers(id, users);
  }
  getAuthPermissions() {
    return this.httpPermissionsService.getAuthPermissions();
  }
}
