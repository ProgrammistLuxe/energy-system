import { Injectable } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { JSONRpcRequest } from '@api-calls/api-models';
import { GetParticipantRes, Participant, UpdateParticipantReq } from './models';

@Injectable({ providedIn: 'root' })
export class HttpParticipantsService {
  constructor(private apiService: ApiService) {}
  addSystem(name: string) {
    return this.apiService.request<{ id: number; name: string }>(
      new JSONRpcRequest('PostParticipantAddParticipant', { name }),
    );
  }
  updateSystem(data: UpdateParticipantReq) {
    return this.apiService.request<Participant>(
      new JSONRpcRequest('PutParticipantUpdateParticipant{participantId}', { ...data }),
    );
  }
  getSystemList() {
    return this.apiService.request<GetParticipantRes>(new JSONRpcRequest('GetParticipantGetParticipantList', {}));
  }
  getSystemById(participant_id: number) {
    return this.apiService.request<Participant>(
      new JSONRpcRequest('GetParticipantGetParticipant{participantId}', { participant_id }),
    );
  }
  deleteSystemById(participant_id: number) {
    return this.apiService.request<Participant>(
      new JSONRpcRequest('DeleteParticipantDeleteParticipant{participantId}', { participant_id }),
    );
  }
}
