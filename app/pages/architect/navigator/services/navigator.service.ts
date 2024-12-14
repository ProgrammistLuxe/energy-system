import { Injectable } from '@angular/core';
import { HttpGraphService } from '@api-calls/services/http-graph-service/http-graph.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { GetGraphClassListSearchReq, GetGraphClassSearchReq } from '@api-calls/services/http-graph-service/models';
import { HttpReferencesService } from '@api-calls/services';
import { ClassInstance } from '../containers/classes-tree/classes-tree.component';
@Injectable()
export class NavigatorService {
  constructor(
    private httpGraphService: HttpGraphService,
    private httpReferencesService: HttpReferencesService,
  ) {}

  private _selectedNode$: BehaviorSubject<ClassInstance | null> = new BehaviorSubject<ClassInstance | null>(null);
  get selectedNode(): ClassInstance | null {
    return this._selectedNode$.value;
  }
  set selectedNode(value: ClassInstance | null) {
    this._selectedNode$.next(value);
  }
  get selectedNode$(): Observable<ClassInstance | null> {
    return this._selectedNode$.asObservable();
  }
  private _selectedUid$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  set selectedUid(uid: string | null) {
    this._selectedUid$.next(uid);
  }
  get selectedUid$() {
    return this._selectedUid$.asObservable();
  }
  get selectedUid() {
    return this._selectedUid$.value;
  }
  getGraphNodeData(uid: string) {
    return this.httpGraphService.getGraphNodeData(uid);
  }
  getGraphClassList() {
    return this.httpGraphService.getGraphClassList();
  }
  getGraphClassListSearched(req: GetGraphClassListSearchReq) {
    return this.httpGraphService.getGraphSearchText(req);
  }
  getGraphClassInstanceList(class_name: string) {
    return this.httpGraphService.getGraphClassInstanceList(class_name);
  }
  getGraphClassAskAttributes(class_name: string) {
    return this.httpGraphService.getGraphClassAskAttributes(class_name);
  }
  getGraphInstanceListByName(data: GetGraphClassSearchReq) {
    return this.httpGraphService.getGraphClassSearch(data);
  }
  getGraphAttributes(uid: string) {
    return this.httpGraphService.getGraphAttributes(uid);
  }
  getGraphAttributesLength(uid: string) {
    return this.httpGraphService.getGraphAttributesLength(uid);
  }
  getClassList() {
    return this.httpReferencesService.getReferencesClass();
  }
  getPrefixList() {
    return this.httpReferencesService.getPrefixList();
  }
}
