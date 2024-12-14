import { Injectable } from '@angular/core';
import { JSONRpcRequest } from '@api-calls/api-models';
import { ApiService } from '@api-calls/api/api.service';
import { AddAttributeReq, GetAttributeListRes, GetTypeListRes, UpdateAttrReq } from './models';
import { ClassTypeAttr } from '../http-class-type-service/models';

@Injectable({ providedIn: 'root' })
export class HttpAttributesService {
  constructor(private apiService: ApiService) {}
  addAttribute(data: AddAttributeReq) {
    return this.apiService.request<{ id: number }>(new JSONRpcRequest('PostAttributeAddAttribute', { ...data }));
  }
  updateAttribute(data: UpdateAttrReq) {
    return this.apiService.request<ClassTypeAttr>(
      new JSONRpcRequest('PutAttributeUpdateAttribute{attributeId}', { ...data }),
    );
  }
  deleteAttribute(attribute_id: number) {
    return this.apiService.request(new JSONRpcRequest('DeleteAttributeDeleteAttribute{attributeId}', { attribute_id }));
  }
  getTypeList() {
    return this.apiService.request<GetTypeListRes>(new JSONRpcRequest('GetAttributeGetTypeList', {}));
  }

  getAttrList() {
    return this.apiService.request<GetAttributeListRes>(new JSONRpcRequest('GetAttributeGetAttributeList', {}));
  }
}
