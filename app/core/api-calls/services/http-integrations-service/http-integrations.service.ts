import { Injectable } from '@angular/core';
import { JSONRpcRequest } from '@api-calls/api-models';
import { ApiService } from '@api-calls/api/api.service';
import {
  AddParticipantsReq,
  DeleteParticipantReq,
  GetIntegrationRes,
  Integration,
  IntegrationParticipant,
  GetIntegrationClassTypeRes,
  GetIntegrationParticipantListRes,
} from './models';

@Injectable({ providedIn: 'root' })
export class HttpIntegrationsService {
  constructor(private apiService: ApiService) {}

  addIntegration(name: string) {
    return this.apiService.request<{ id: number; name: string }>(
      new JSONRpcRequest('PostIntegrationAddIntegration', { name }),
    );
  }
  getIntegrationList() {
    return this.apiService.request<GetIntegrationRes>(new JSONRpcRequest('GetIntegrationGetIntegrationList', {}));
  }
  getIntegrationById(integration_id: number) {
    return this.apiService.request<Integration>(
      new JSONRpcRequest('GetIntegrationGetIntegration{integrationId}', { integration_id }),
    );
  }
  updateIntegration(integration_id: number, name: string) {
    return this.apiService.request<Integration>(
      new JSONRpcRequest('PutIntegrationUpdateIntegration{integrationId}', { integration_id, name }),
    );
  }
  deleteIntegration(integration_id: number) {
    return this.apiService.request<Integration>(
      new JSONRpcRequest('DeleteIntegrationDeleteIntegration{integrationId}', { integration_id }),
    );
  }
  getIntegrationParticipantList(integration_id: number) {
    return this.apiService.request<GetIntegrationParticipantListRes>(
      new JSONRpcRequest('GetIntegrationGetParticipantList{integrationId}', { integration_id }),
    );
  }
  addParticipantsToIntegration(data: AddParticipantsReq) {
    return this.apiService.request<IntegrationParticipant>(
      new JSONRpcRequest('PostIntegrationAddParticipant{participantId}', { ...data }),
    );
  }
  deleteParticipantFromIntegration(data: DeleteParticipantReq) {
    return this.apiService.request(
      new JSONRpcRequest('DeleteIntegrationDeleteParticipant{participantId}', { ...data }),
    );
  }
  getClassTypeList(integration_id: number) {
    return this.apiService.request<GetIntegrationClassTypeRes>(
      new JSONRpcRequest('GetIntegrationGetClassTypeList{integrationId}', { integration_id }),
    );
  }
}
