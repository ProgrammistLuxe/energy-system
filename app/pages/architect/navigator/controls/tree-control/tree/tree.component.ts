import { Component, Input, forwardRef } from '@angular/core';
import { TreeControlService } from '../services/tree-control.service';
import { NotificationsService, SessionStorageService } from '@services';
import { ReplaySubject, debounceTime, takeUntil } from 'rxjs';
import { AttrsFlatNode } from './models';
import { FlatTreeControl } from '@angular/cdk/tree';
import { AttrsTreeData } from './utils/attrs-tree-data';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { ApiResolverComponent, EmptyTemplateComponent } from '@shared/components';
import { MatIconButtonCustomDirective, OverFlowTooltipDirective } from '@shared/directives';
import { materialModules } from '@shared/materials';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tree',
  imports: [
    CommonModule,
    ApiResolverComponent,
    EmptyTemplateComponent,
    MatIconButtonCustomDirective,
    forwardRef(() => OverFlowTooltipDirective),
    materialModules.matCheckBoxModule,
    materialModules.matMenuModule,
    materialModules.matTreeModule,
    materialModules.matProgressSpinnerModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    materialModules.matButtonModule,
  ],
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss',
})
export class TreeComponent {
  @Input() singleSelection: boolean = true;

  errorCode: number | null = null;
  errorMessage: string | null = null;
  getLevel = (node: AttrsFlatNode) => node.level;
  isExpandable = (node: AttrsFlatNode) => node.expandable;
  hasChild = (_: number, _nodeData: AttrsFlatNode) => _nodeData.expandable;

  treeControl: FlatTreeControl<AttrsFlatNode> = new FlatTreeControl<AttrsFlatNode>(this.getLevel, this.isExpandable);

  dataSource: AttrsTreeData | null = null;
  private checkedNodesIndex: number = -1;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private treeControlService: TreeControlService,
    private notificationsService: NotificationsService,
  ) {
    this.dataSource = new AttrsTreeData(this.treeControl, this.treeControlService, this.notificationsService);
  }
  get initLoading() {
    return this.treeControlService.initLoading;
  }
  get treeExpanding() {
    return this.treeControlService.treeExpanding;
  }
  get checkedNodes() {
    return this.treeControlService.checkedNodes;
  }
  get selectedNode() {
    return this.treeControlService.selectedNode;
  }
  getTree() {
    const class_name = this.treeControlService.selectedClassName;
    this.errorCode = null;
    this.errorMessage = null;
    this.treeControlService
      .getTree(class_name)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (!Array.isArray(response)) {
          this.errorCode = response.code;
          this.errorMessage = response.message;
          return;
        }
        if (!this.dataSource) {
          return;
        }
        this.dataSource.data = response;
        if (this.selectedNode && this.singleSelection) {
          this.treeControlService.treeExpanding = true;
          this.expandRecursive(this.selectedNode);
          return;
        }
        if (!this.singleSelection && this.checkedNodes.length && this.checkedNodes.length <= 8) {
          this.treeControlService.treeExpanding = true;
          this.expandRecursiveMulti();
          return;
        }
      });
  }
  toggleNode(node: AttrsFlatNode) {
    if (!node.selectable || !this.singleSelection) {
      return;
    }
    if (this.selectedNode === node.id) {
      this.treeControlService.selectedNodes = [];
      this.treeControlService.selectedNode = '';
    } else {
      this.treeControlService.selectedNodes = [{ uid: node.id, value: node.title }];
      this.treeControlService.selectedNode = node.id;
    }
  }
  checkNodes(node: AttrsFlatNode) {
    if (this.checkedNodes.includes(node.id)) {
      this.treeControlService.checkedNodes = this.checkedNodes.filter((item) => item !== node.id);
      this.treeControlService.selectedNodes = this.treeControlService.selectedNodes.filter(
        (item) => item.uid !== node.id,
      );
    } else {
      this.treeControlService.checkedNodes = [...this.checkedNodes, node.id];
      this.treeControlService.selectedNodes = [
        ...this.treeControlService.selectedNodes,
        { uid: node.id, value: node.title },
      ];
    }
  }
  private fillSelectedNodes() {
    if (!this.dataSource?.data) {
      return;
    }
    if (this.singleSelection) {
      this.treeControlService.selectedNodes = this.dataSource.data
        .filter((node) => this.treeControlService.selectedNode === node.id)
        .map((item) => ({ value: item.title, uid: item.id }));
    } else {
      this.treeControlService.selectedNodes = this.dataSource.data
        .filter((node) => this.treeControlService.checkedNodes.includes(node.id))
        .map((item) => ({ value: item.title, uid: item.id }));
    }
  }
  private expandRecursiveMulti() {
    this.checkedNodesIndex++;
    this.treeControlService
      .getPathFromRoot(this.checkedNodes[this.checkedNodesIndex])
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (response.error) {
          this.treeControlService.treeExpanding = false;
          const message = getErrorsMessage(response.error) || 'Ошибка раскрытия дерева';
          this.notificationsService.displayMessage('Ошибка', message, 'error', 3000);
          return;
        }
        response.result.splice(0, 1);
        this.expandChildrenMulti(response.result);
      });
  }
  private expandRecursive(uid: string) {
    this.treeControlService
      .getPathFromRoot(uid)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (response.error) {
          this.treeControlService.treeExpanding = false;
          const message = getErrorsMessage(response.error) || 'Ошибка раскрытия дерева';
          this.notificationsService.displayMessage('Ошибка', message, 'error', 3000);
          return;
        }
        response.result.splice(0, 1);
        this.expandChildren(response.result);
      });
  }
  private scrollToItem() {
    let element = null;
    if (this.singleSelection) {
      element = document.getElementById(this.selectedNode);
    }
    element = document.getElementById(this.checkedNodes[0]);
    if (!element) {
      this.treeControlService.treeExpanding = false;
      return;
    }
    const tree = document.querySelector('.tree');
    if (!tree || !element) {
      this.treeControlService.treeExpanding = false;
    } else {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      let treeScrolled = false;
      const scrollListener = () => {
        treeScrolled = true;
        tree.addEventListener('scrollend', () => {
          this.treeControlService.treeExpanding = false;
        });
        tree.removeEventListener('scroll', scrollListener);
      };
      tree.addEventListener('scroll', scrollListener);

      setTimeout(() => {
        if (!treeScrolled) {
          this.treeControlService.treeExpanding = false;
        }
      }, 1000);
    }
  }
  private expandChildrenMulti(uidList: string[]) {
    if (!uidList.length && this.checkedNodesIndex === this.checkedNodes.length - 1) {
      this.fillSelectedNodes();
      this.checkedNodesIndex = -1;
      this.scrollToItem();
      return;
    }
    if (!uidList.length) {
      this.expandRecursiveMulti();
      return;
    }
    const destroy$: ReplaySubject<void> = new ReplaySubject<void>();
    const id = uidList.shift();
    const node = this.dataSource?.data.find((item) => item.id === id);
    if (!node) {
      this.checkedNodesIndex = -1;
      this.treeControlService.treeExpanding = false;
      return;
    }
    if (this.treeControl.isExpanded(node)) {
      setTimeout(() => {
        destroy$.next();
        destroy$.complete();
        this.expandChildrenMulti(uidList);
      }, 300);
      return;
    }
    this.treeControl.expand(node);

    this.treeControlService.expanded$.pipe(takeUntil(destroy$), debounceTime(300)).subscribe((value) => {
      if (value) {
        destroy$.next();
        destroy$.complete();
        this.treeControlService.expanded = false;
        this.expandChildrenMulti(uidList);
      }
    });
  }
  private expandChildren(uidList: string[]) {
    if (!uidList.length) {
      this.fillSelectedNodes();
      this.scrollToItem();
      return;
    }
    const destroy$: ReplaySubject<void> = new ReplaySubject<void>();
    const id = uidList.shift();
    const node = this.dataSource?.data.find((item) => item.id === id);
    if (!node) {
      this.treeControlService.treeExpanding = false;
      return;
    }
    if (this.treeControl.isExpanded(node)) {
      setTimeout(() => {
        destroy$.next();
        destroy$.complete();
        this.expandChildren(uidList);
      }, 300);
      return;
    }
    this.treeControl.expand(node);

    this.treeControlService.expanded$.pipe(takeUntil(destroy$), debounceTime(300)).subscribe((value) => {
      if (value) {
        destroy$.next();
        destroy$.complete();
        this.treeControlService.expanded = false;
        this.expandChildren(uidList);
      }
    });
  }

  ngOnInit() {
    this.treeControlService.loadTree$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (value) {
        this.getTree();
      }
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.treeControlService.treeExpanding) {
      this.treeControlService.treeExpanding = false;
    }
  }
}
