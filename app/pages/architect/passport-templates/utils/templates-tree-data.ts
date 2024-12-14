import { CollectionViewer, DataSource, SelectionChange } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { BehaviorSubject, Observable, finalize, map, merge, takeUntil } from 'rxjs';
import { PassportTemplatesService } from '../services/passport-templates.service';
import { TemplateFlatNode } from '../models';
import { getCalculatedTemplateNodes } from './templateFlatNodeMapper';
import { NotificationsService, SessionStorageService } from '@services';
import { PassTemplateNode } from '../models/pass-template-node.models';

export class TemplatesTreeData implements DataSource<TemplateFlatNode> {
  private dataChange = new BehaviorSubject<TemplateFlatNode[]>([]);
  get data(): TemplateFlatNode[] {
    return this.dataChange.value;
  }
  set data(value: TemplateFlatNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(
    private _treeControl: FlatTreeControl<TemplateFlatNode>,
    private passportTemplatesServices: PassportTemplatesService,
    private notificationsService: NotificationsService,
    private sessionStorage: SessionStorageService,
  ) {
    this._treeControl.expansionModel.changed.subscribe((change) => {
      if (change.added || change.removed) {
        this.handleTreeControl(change);
      }
    });
  }

  connect(collectionViewer: CollectionViewer): Observable<TemplateFlatNode[]> {
    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }

  disconnect(collectionViewer: CollectionViewer): void {}

  handleTreeControl(change: SelectionChange<TemplateFlatNode>) {
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
  toggleNode(node: TemplateFlatNode, expand: boolean) {
    if (!expand) {
      const index = this.data.indexOf(node);
      let count = 0;
      for (let i = index + 1; i < this.data.length && this.data[i].level > node.level; i++, count++) {}
      this.data.splice(index + 1, count);
      this.dataChange.next(this.data);
      return;
    }
    node.loading = true;
    this.passportTemplatesServices
      .loadChildren(node.id)
      .pipe(finalize(() => (node.loading = false)))
      .subscribe((res) => {
        if (res.error) {
          this.notificationsService.displayMessage('Ошибка', 'Ошибка получния вложенных элементов', 'error');
          return;
        }
        const index = this.data.indexOf(node);
        if (index < 0) {
          return;
        }
        const folders: PassTemplateNode[] = res.result.children.map((child) => ({
          id: child.id,
          parent: child.parent,
          hasChildren: true,
          level: child.level,
          title: child.title,
          type: 'folder',
        }));
        const templates: PassTemplateNode[] = res.result.passports_template_folders.map((template) => ({
          id: template.id,
          title: template.title,
          parent: res.result.id,
          type: 'template',
          level: res.result.level + 1,
          hasChildren: false,
        }));
        const drafts: PassTemplateNode[] = res.result.draft_passports_template.map((draft) => ({
          id: draft.id,
          title: draft.title + ' (черновик)',
          parent: res.result.id,
          type: 'draft',
          level: res.result.level + 1,
          hasChildren: false,
        }));
        const nodes = getCalculatedTemplateNodes([...folders, ...templates, ...drafts]);
        this.data.splice(index + 1, 0, ...nodes);
        this.passportTemplatesServices.expanded = true;
        this.dataChange.next(this.data);
      });
  }
}
