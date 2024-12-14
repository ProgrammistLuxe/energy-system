import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PassportFlatNode } from '../models';
import { HttpTreeService } from '@api-calls/services';

@Injectable({ providedIn: 'root' })
export class PassportsTreeService {
  constructor(private httpTreeService: HttpTreeService) {}
  navigateToNode$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
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
  private _reloadTree$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  get reloadTree$(): Observable<boolean> {
    return this._reloadTree$.asObservable();
  }
  set reloadTree(value: boolean) {
    this._reloadTree$.next(value);
  }

  private _expanded$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  get expanded$(): Observable<boolean> {
    return this._expanded$.asObservable();
  }
  set expanded(value: boolean) {
    this._expanded$.next(value);
  }

  private _currentNode$: BehaviorSubject<PassportFlatNode | null> = new BehaviorSubject<PassportFlatNode | null>(null);
  set currentNode(node: PassportFlatNode | null) {
    this._currentNode$.next(node);
  }
  get currentNode(): PassportFlatNode | null {
    return this._currentNode$.value;
  }
  get currentNode$(): Observable<PassportFlatNode | null> {
    return this._currentNode$.asObservable();
  }
  private _selectedUID$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  get selectedUID(): string | null {
    return this._selectedUID$.value;
  }
  set selectedUID(value: string | null) {
    this._selectedUID$.next(value);
  }
  get selectedUID$(): Observable<string | null> {
    return this._selectedUID$.asObservable();
  }
  setNavigationUid(uid: string | null) {
    this.navigateToNode$.next(uid);
  }
  getPathFromRoot(uid: string) {
    return this.httpTreeService.getPathFromRoot(uid);
  }
  loadChildren(uid: string) {
    return this.httpTreeService.getNodeChildrenById(uid);
  }
  loadTree() {
    return this.httpTreeService.getBaseNode();
  }
  clearTreeState() {
    this._selectedUID$.next(null);
    this._currentNode$.next(null);
    this.setNavigationUid(null);
  }
}
