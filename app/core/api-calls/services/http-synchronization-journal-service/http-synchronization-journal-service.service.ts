import { Injectable } from '@angular/core';
import { JSONRpcRequest } from '@api-calls/api-models';
import { ApiService } from '@api-calls/api/api.service';
import { GetRecordsListReq, GetRecordsListRes } from './models';

@Injectable({
  providedIn: 'root',
})
export class HttpSynchronizationJournalServiceService {
  constructor(private apiService: ApiService) {}

  getLogs(data: GetRecordsListReq) {
    return this.apiService.request<GetRecordsListRes>(new JSONRpcRequest('GetGetLogs', { ...data }));
  }
  getLevels() {
    return this.apiService.request<{ levels: string[] }>(new JSONRpcRequest('GetGetAvailableLevels', {}));
  }
  getSources() {
    return this.apiService.request<{ sources: string[] }>(new JSONRpcRequest('GetGetAvailableSources', {}));
  }
  getJournalNames() {
    return this.apiService.request<{ journal_names: string[] }>(new JSONRpcRequest('GetGetAvailableJournals', {}));
  }
}
