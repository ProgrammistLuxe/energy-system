import { Injectable } from '@angular/core';
import { JSONRpcRequest } from '@api-calls/api-models';
import { ApiService } from '@api-calls/api/api.service';
import { AppConfigService } from '@services';
import { GetDiffListRes, GetDiffRes, PostDiffReq, PostDiffRes } from './models';

@Injectable({
  providedIn: 'root',
})
export class HttpDiffService {
  private graph_context: string = this.appConfigService.config['GRAPH_CONTEXT'];

  constructor(
    private apiService: ApiService,
    private appConfigService: AppConfigService,
  ) {}

  getGraphDiff(pageSize: number = 50, pageIndex: number = 0) {
    return this.apiService.request<GetDiffListRes>(
      new JSONRpcRequest('GetGraphDiffV3', { size: pageSize, page: pageIndex + 1 }),
    );
  }
  getGraphDiffDiffIdStatus(diff_id: number) {
    return this.apiService.request<GetDiffRes>(new JSONRpcRequest('GetGraphDiffByIdStatusV3', { diff_id }));
  }
  postGraphDiffAsync(data: PostDiffReq[]) {
    const postData = data.map((item) => ({ context: this.graph_context, ...item }));
    return this.apiService.request<PostDiffRes>(new JSONRpcRequest('PostGraphDiffAsyncV3', { data: postData }));
  }
}
