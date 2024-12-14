import { Injectable } from '@angular/core';
import { JSONRpcRequest } from '@api-calls/api-models';
import { ApiService } from '@api-calls/api/api.service';
import { GetBaseNodeRes, TreeNode } from './models';
import { AppConfigService } from '@services';

@Injectable({
  providedIn: 'root',
})
export class HttpTreeService {
  private graph_context: string = this.appConfigService.config['GRAPH_CONTEXT'];

  constructor(
    private apiService: ApiService,
    private appConfigService: AppConfigService,
  ) {}

  getBaseNode(class_name: string = '') {
    const req = class_name ? { class_name, context: this.graph_context } : { context: this.graph_context };
    return this.apiService.request<GetBaseNodeRes>(new JSONRpcRequest('GetGraphGetBaseNodeV3', req));
  }
  getNodeChildrenById(uid: string, class_name: string = '') {
    const req = class_name ? { uid, class_name, context: this.graph_context } : { uid, context: this.graph_context };
    return this.apiService.request<TreeNode[]>(new JSONRpcRequest('GetGraphGetNode_v3', req));
  }
  getPathFromRoot(uid: string) {
    return this.apiService.request<string[]>(
      new JSONRpcRequest('GetGraphGetPathV3', { uid, context: this.graph_context }),
    );
  }
}
