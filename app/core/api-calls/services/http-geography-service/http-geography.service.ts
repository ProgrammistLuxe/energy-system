import { Injectable } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { JSONRpcRequest } from '@api-calls/api-models';
import { AppConfigService } from '@services';
import { GetCoordsByName, GetCoordsByUid, GraphGeography } from './models';

@Injectable({ providedIn: 'root' })
export class HttpGeographyService {
  private graph_context: string = this.appConfigService.config['GRAPH_CONTEXT'];

  constructor(
    private apiService: ApiService,
    private appConfigService: AppConfigService,
  ) {}

  getGraphGeographyV3() {
    return this.apiService.request<GraphGeography>(
      new JSONRpcRequest('GetGraphGeographyV3', this.getGraphRequestData()),
    );
  }
  getGraphGeographyV2V3(class_list: string) {
    return this.apiService.request<GraphGeography>(
      new JSONRpcRequest('GetGraphGeographyV2_v3', this.getGraphRequestData({ class_list })),
    );
  }
  getCoordsByUid(uuid_to_search: string) {
    return this.apiService.request<GetCoordsByUid>(new JSONRpcRequest('GetCoordsByUid_', { uuid_to_search }));
  }
  getCoordsByName(name_to_search: string) {
    return this.apiService.request<GetCoordsByName>(new JSONRpcRequest('GetCoordsByName_', { name_to_search }));
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
