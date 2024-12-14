import { Injectable } from '@angular/core';
import { HttpTreeService } from '@api-calls/services';
import { BehaviorSubject, Observable, finalize, map } from 'rxjs';
import { AttrsFlatNode, AttrsNode } from '../tree/models';
import { getCalculatedAttrsNodes } from '../tree/utils/attrsFlatNodeMapper';
import { AttributesLinkData } from '@api-calls/services/http-graph-service/models';

@Injectable()
export class TreeControlService {
  constructor(private httpTreeService: HttpTreeService) {}
  navigateToNode$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private _selectedClassName: string = '';
  set selectedClassName(value: string) {
    this._selectedClassName = value;
  }
  get selectedClassName() {
    return this._selectedClassName;
  }
  private _expanded$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  get expanded$(): Observable<boolean> {
    return this._expanded$.asObservable();
  }
  set expanded(value: boolean) {
    this._expanded$.next(value);
  }
  private _initLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  set initLoading(value: boolean) {
    this._initLoading$.next(value);
  }
  get initLoading() {
    return this._initLoading$.value;
  }
  private _treeExpanding: boolean = false;
  get treeExpanding(): boolean {
    return this._treeExpanding;
  }
  set treeExpanding(value: boolean) {
    this._treeExpanding = value;
  }

  private _selectedNode$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  get selectedNode() {
    return this._selectedNode$.value;
  }
  set selectedNode(value: string) {
    this._selectedNode$.next(value);
  }
  get selectedNode$(): Observable<string> {
    return this._selectedNode$.asObservable();
  }

  private _checkedNodes$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  get checkedNodes() {
    return this._checkedNodes$.value;
  }
  set checkedNodes(value: string[]) {
    this._checkedNodes$.next(value);
  }
  get checkedNodes$(): Observable<string[]> {
    return this._checkedNodes$.asObservable();
  }
  private _selectedNodes: AttributesLinkData[] = [];
  set selectedNodes(value: AttributesLinkData[]) {
    this._selectedNodes = value;
  }
  get selectedNodes(): AttributesLinkData[] {
    return this._selectedNodes;
  }
  private _loadTree$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  get loadTree$(): Observable<boolean> {
    return this._loadTree$.asObservable();
  }
  set loadTree(value: boolean) {
    this._loadTree$.next(value);
  }
  getPathFromRoot(uid: string) {
    return this.httpTreeService.getPathFromRoot(uid);
  }
  loadChildren(uid: string, class_name: string) {
    return this.httpTreeService.getNodeChildrenById(uid, class_name);
  }
  getTree(class_name: string) {
    this.initLoading = true;
    return this.httpTreeService.getBaseNode(class_name).pipe(
      finalize(() => (this.initLoading = false)),
      map((response) => {
        if (response.error) {
          return {
            message: String(response),
            code: +response,
          };
        }
        const result: AttrsNode[] = response.result.childrenList.map((item) => ({
          id: item.uid,
          parent: item.parentUid,
          hasChildren: item.hasChildren,
          level: 0,
          title: item.name,
          type: item.tagClass,
          selectable: item.selectable,
        }));
        return getCalculatedAttrsNodes(result);
      }),
    );
  }
}
