import { Injectable } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { JSONRpcRequest } from '@api-calls/api-models';
import { GraphClasses } from './models/graph-classes.model';
import { GraphClassList } from './models/graph-class-list.model';
import { AppConfigService } from '@services';
import {
  GetGraphClassSearchReq,
  GetGraphClassSearchRes,
  GetGraphSubstationsSchema,
  GetPassportData,
  GetPassportReq,
  GraphNodeData,
  GetAttributesData,
  GetGraphClassListSearchReq,
  GetPassportFilesReq,
  GetPassportFilesRes,
  GetClassAskDataRes,
} from './models';

@Injectable({ providedIn: 'root' })
export class HttpGraphService {
  private graph_context: string = this.appConfigService.config['GRAPH_CONTEXT'];

  constructor(
    private apiService: ApiService,
    private appConfigService: AppConfigService,
  ) {}

  getGraphList() {
    return this.apiService.request<{ data: string[] }>(new JSONRpcRequest('GetGraphListV3', {}));
  }

  getGraphClassList() {
    return this.apiService.request<GraphClasses>(
      new JSONRpcRequest('GetGraphClassListV3', { context: this.graph_context }),
    );
  }
  getGraphSearchText(data: GetGraphClassListSearchReq) {
    return this.apiService.request<GraphClasses>(
      new JSONRpcRequest('GetGraphSearchText_v3', this.getGraphRequestData({ ...data })),
    );
  }
  getGraphClassInstanceList(class_name: string) {
    return this.apiService.request<GraphClassList>(
      new JSONRpcRequest('GetGraphClassInstanceListV3', { class_name, context: this.graph_context }),
    );
  }
  getGraphClassAskAttributes(class_name: string) {
    return this.apiService.request<GetClassAskDataRes>(
      new JSONRpcRequest('GetGraphClassAskAttributes_v3', { class_name, context: this.graph_context }),
    );
  }

  getGraphNodeData(uid: string) {
    return this.apiService.request<GraphNodeData>(
      new JSONRpcRequest('GetGraphNodeDataV3', this.getGraphRequestData({ uid })),
    );
  }
  getGraphAttributes(uid: string) {
    return this.apiService.request<GetAttributesData>(
      new JSONRpcRequest('GetGraphClassAttributes_v3', this.getGraphRequestData({ uid })),
    );
  }
  getGraphAttributesLength(uid: string) {
    return this.apiService.request<{ data: { length: number } }>(
      new JSONRpcRequest('GetGraphClassAttributesLength_v3', this.getGraphRequestData({ uid })),
    );
  }

  getGraphPassport(data: GetPassportReq) {
    return this.apiService.request<GetPassportData>(
      new JSONRpcRequest('GetGraphPassportV3', this.getGraphRequestData(data)),
    );
  }
  getGraphPassportFiles(data: GetPassportFilesReq) {
    return this.apiService.request<GetPassportFilesRes>(
      new JSONRpcRequest('GetGraphPassportFiles_v3', this.getGraphRequestData(data)),
    );
  }
  getGraphTopologyV3(class_name: string) {
    return this.apiService.request<GetGraphSubstationsSchema>(
      new JSONRpcRequest('GetGraphTopologyV3', this.getGraphRequestData({ class_name })),
    );
  }
  getGraphGetPngV3(uid: string) {
    return this.apiService.request<{ data: string }>(
      new JSONRpcRequest('GetGraphGetPngV3', this.getGraphRequestData({ uid })),
    );
  }
  getGraphGetPngUidV3(uid: string) {
    return this.apiService.request<{ data: Record<string, string> }>(
      new JSONRpcRequest('GetGraphGetPngUidV3', this.getGraphRequestData({ uid })),
    );
  }
  getGraphClassSearch(data: GetGraphClassSearchReq) {
    return this.apiService.request<GetGraphClassSearchRes>(
      new JSONRpcRequest('GetGraphClassSearch_v3', this.getGraphRequestData({ ...data })),
    );
  }
  postGraphSparqlV3(query: string) {
    return this.apiService.request<any>(new JSONRpcRequest('PostGraphSparql_v3', this.getGraphRequestData({ query })));
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
