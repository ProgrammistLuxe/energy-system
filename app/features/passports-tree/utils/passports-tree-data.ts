import { CollectionViewer, DataSource, SelectionChange } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { BehaviorSubject, Observable, finalize, map, merge, take } from 'rxjs';
import { PassportsTreeService } from '../services/passports-tree.service';
import { NotificationsService, SessionStorageService } from '@services';
import { PassportFlatNode, PassportNode } from '../models';
import { getCalculatedPassportNodes } from './passportFlatNodeMapper';

export class PassportTreeData implements DataSource<PassportFlatNode> {
  private dataChange = new BehaviorSubject<PassportFlatNode[]>([]);
  get data(): PassportFlatNode[] {
    return this.dataChange.value;
  }
  set data(value: PassportFlatNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(
    private _treeControl: FlatTreeControl<PassportFlatNode>,
    private passportsServices: PassportsTreeService,
    private notificationsService: NotificationsService,
    private sessionStorage: SessionStorageService,
  ) {
    this._treeControl.expansionModel.changed.subscribe((change) => {
      if (change.added || change.removed) {
        this.handleTreeControl(change);
      }
    });
  }

  connect(collectionViewer: CollectionViewer): Observable<PassportFlatNode[]> {
    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }

  disconnect(collectionViewer: CollectionViewer): void {}

  handleTreeControl(change: SelectionChange<PassportFlatNode>) {
    if (change.added) {
      change.added.forEach((node) => this.toggleNode(node, true));
    }
    if (change.removed) {
      change.removed
        .slice()
        .reverse()
        .forEach((node) => this.toggleNode(node, false));
    }
  }
  toggleNode(node: PassportFlatNode, expand: boolean) {
    if (!expand) {
      const index = this.data.indexOf(node);
      let count = 0;
      for (let i = index + 1; i < this.data.length && this.data[i].level > node.level; i++, count++) {}
      this.data.splice(index + 1, count);
      this.dataChange.next(this.data);
      return;
    }
    node.loading = true;
    const index = this.data.indexOf(node);
    if (index < 0) {
      node.loading = false;
      return;
    }
    this.passportsServices
      .loadChildren(node.id)
      .pipe(finalize(() => (node.loading = false)))
      .subscribe((res) => {
        if (res.error) {
          this.notificationsService.displayMessage('Ошибка', 'Ошибка получния вложенных элементов', 'error');
          this.passportsServices.expanded = true;
          return;
        }
        if (!res.result.length) {
          this.passportsServices.expanded = true;
          return;
        }
        const nodeList: PassportNode[] = res.result[0].childrenList.map((child) => ({
          id: child.uid,
          parent: child.parentUid,
          hasChildren: child.hasChildren,
          level: node.level + 1,
          title: child.name,
          passport: child.passport,
          type: child.tagClass,
        }));
        const index = this.data.indexOf(node);
        const nodes = getCalculatedPassportNodes(nodeList);
        this.data.splice(index + 1, 0, ...nodes);
        this.dataChange.next(this.data);
        this.passportsServices.expanded = true;
      });
  }
}
