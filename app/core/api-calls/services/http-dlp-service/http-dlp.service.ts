import { Injectable } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { JSONRpcRequest } from '@api-calls/api-models';
import { AppConfigService } from '@services';

@Injectable({ providedIn: 'root' })
export class HttpDlpService {
  private graph_context: string = this.appConfigService.config['GRAPH_CONTEXT'];

  constructor(
    private apiService: ApiService,
    private appConfigService: AppConfigService,
  ) {}
  getGraphDlpV3(uid: string, format: 'xml' | 'json-ld') {
    return this.apiService.request<{ data: string }>(
      new JSONRpcRequest('GetGraphGetDlp_v3', this.getGraphRequestData({ uid, format })),
    );
  }
  getObjectValue(uidList: string[]) {
    return this.apiService.request<{
      data: {
        uid: string;
        msg: string;
      }[];
    }>(new JSONRpcRequest('PostGraphGetControlPanel_v3', { data: uidList }));
  }
  private getGraphRequestData(data: Record<string, any> | null = null) {
    if (data) {
      return {
        context: this.graph_context,
        ...data,
      };
    } else {
      return {
        context: this.graph_context,
      };
    }
  }
}
