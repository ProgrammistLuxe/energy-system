import { CollectionViewer, DataSource, SelectionChange } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { BehaviorSubject, Observable, finalize, map, merge, take } from 'rxjs';
import { TreeControlService } from '../../services/tree-control.service';
import { NotificationsService, SessionStorageService } from '@services';
import { AttrsFlatNode, AttrsNode } from '../models';
import { getCalculatedAttrsNodes } from '../utils/attrsFlatNodeMapper';

export class AttrsTreeData implements DataSource<AttrsFlatNode> {
  private dataChange = new BehaviorSubject<AttrsFlatNode[]>([]);
  get data(): AttrsFlatNode[] {
    return this.dataChange.value;
  }
  set data(value: AttrsFlatNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(
    private _treeControl: FlatTreeControl<AttrsFlatNode>,
    private treeControlService: TreeControlService,
    private notificationsService: NotificationsService,
  ) {
    this._treeControl.expansionModel.changed.subscribe((change) => {
      if (change.added || change.removed) {
        this.handleTreeControl(change);
      }
    });
  }

  connect(collectionViewer: CollectionViewer): Observable<AttrsFlatNode[]> {
    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }

  disconnect(collectionViewer: CollectionViewer): void {}

  handleTreeControl(change: SelectionChange<AttrsFlatNode>) {
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
  toggleNode(node: AttrsFlatNode, expand: boolean) {
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
    const class_name = this.treeControlService.selectedClassName;
    this.treeControlService
      .loadChildren(node.id, class_name)
      .pipe(finalize(() => (node.loading = false)))
      .subscribe((res) => {
        if (res.error) {
          this.notificationsService.displayMessage('Ошибка', 'Ошибка получния вложенных элементов', 'error');
          return;
        }
        if (!res.result.length) {
          return;
        }
        const nodeList: AttrsNode[] = res.result[0].childrenList.map((child) => ({
          id: child.uid,
          parent: child.parentUid,
          hasChildren: child.hasChildren,
          level: node.level + 1,
          title: child.name,
          selectable: child.selectable,
          type: child.tagClass,
        }));
        const index = this.data.indexOf(node);
        const nodes = getCalculatedAttrsNodes(nodeList);
        this.data.splice(index + 1, 0, ...nodes);
        this.dataChange.next(this.data);
        this.treeControlService.expanded = true;
      });
  }
}
