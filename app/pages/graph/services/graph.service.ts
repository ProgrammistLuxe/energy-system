import { Injectable } from '@angular/core';
import { HttpGraphService } from '@api-calls/services/http-graph-service/http-graph.service';

@Injectable({
  providedIn: 'root',
})
export class GraphService {
  constructor(private httpGraphService: HttpGraphService) {}

  getSubstationsSchema(class_name: string) {
    return this.httpGraphService.getGraphTopologyV3(class_name);
  }
  getGraphNodeData(uid: string) {
    return this.httpGraphService.getGraphNodeData(uid);
  }
}
