import { Injectable } from '@angular/core';
import { JSONRpcRequest } from '@api-calls/api-models';
import { ApiService } from '@api-calls/api/api.service';
import { AddClassTypeReq, ClassType, GetClassTypeAttrRes, GetClassTypeRes, UpdateClassTypeReq } from './models';

@Injectable({ providedIn: 'root' })
export class HttpClassTypeService {
  constructor(private apiService: ApiService) {}
  addClassType(data: AddClassTypeReq) {
    return this.apiService.request<{ id: number }>(new JSONRpcRequest('PostClassTypeAddClassType', { ...data }));
  }
  getClassTypeList() {
    return this.apiService.request<GetClassTypeRes>(new JSONRpcRequest('GetClassTypeGetClassTypeList', {}));
  }
  getClassTypeById(class_type_id: number) {
    return this.apiService.request<ClassType>(
      new JSONRpcRequest('GetClassTypeGetClassType{classTypeId}', { class_type_id }),
    );
  }
  updateClassType(data: UpdateClassTypeReq) {
    return this.apiService.request<ClassType>(
      new JSONRpcRequest('PutClassTypeUpdateClassType{classTypeId}', { ...data }),
    );
  }
  deleteClassType(class_type_id: number) {
    return this.apiService.request(
      new JSONRpcRequest('DeleteClassTypeDeleteClassType{classTypeId}', { class_type_id }),
    );
  }
  getAttrsList(class_type_id: number) {
    return this.apiService.request<GetClassTypeAttrRes>(
      new JSONRpcRequest('GetClassTypeGetAttributeList{classTypeId}', { class_type_id }),
    );
  }
}
