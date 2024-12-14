import { Injectable } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { JSONRpcRequest } from '@api-calls/api-models';
import {
  AddAsyncAttrsRes,
  AddSyncAttrsByFormReq,
  AddSyncAttrsReq,
  DesyncAttrsReqModel,
  GetSyncObjectListRes,
  SyncAttrsReq,
} from './models';

@Injectable({ providedIn: 'root' })
export class HttpSynchronizationService {
  constructor(private apiService: ApiService) {}
  getSyncObjectList(class_type_id: number) {
    return this.apiService.request<GetSyncObjectListRes>(
      new JSONRpcRequest('GetSynchronizationGetSyncObjectList{classTypeId}', { class_type_id }),
    );
  }
  getSyncObject(synchronization_id: number) {
    return this.apiService.request(
      new JSONRpcRequest('GetSynchronizationGetSyncObject{synchronizationId}', { synchronization_id }),
    );
  }
  addSyncObjects(data: AddSyncAttrsByFormReq) {
    return this.apiService.request(
      new JSONRpcRequest('PostSynchronizationAddSyncAttributes{classTypeId}', { ...data }),
    );
  }
  synchronize(data: SyncAttrsReq) {
    return this.apiService.request(
      new JSONRpcRequest('PostSynchronizationSyncAttributes{classTypeId}Synchronize', { ...data }),
    );
  }
  addSyncAttrsFromFile(data: AddSyncAttrsReq) {
    return this.apiService.request<AddAsyncAttrsRes>(
      new JSONRpcRequest('PostSynchronizationAddSyncAttributesFile{classTypeId}', { ...data }),
    );
  }
  desynchronize(data: DesyncAttrsReqModel) {
    return this.apiService.request(
      new JSONRpcRequest('PostSynchronizationSyncAttributes{classTypeId}Split', { ...data }),
    );
  }
}
