import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input, input } from '@angular/core';
import {
  SearchFieldComponent,
  ApiResolverComponent,
  EmptyTemplateComponent,
  MatIconButtonCustomDirective,
  OverFlowTooltipDirective,
  materialModules,
} from '@shared/index';
import { ReplaySubject, debounceTime, finalize, takeUntil } from 'rxjs';
import { PassportsTreeService } from './services/passports-tree.service';
import { NotificationsService, SessionStorageService } from '@services';
import { PassportTreeData } from './utils/passports-tree-data';
import { FlatTreeControl } from '@angular/cdk/tree';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { PassportFlatNode, PassportNode } from './models';
import { getCalculatedPassportNodes } from './utils/passportFlatNodeMapper';

const SELECTED_PASSPORT_NODE_KEY = 'SELECTED_PASSPORT_NODE_KEY';
@Component({
  selector: 'app-passports-tree',
  imports: [
    CommonModule,
    SearchFieldComponent,
    ApiResolverComponent,
    EmptyTemplateComponent,
    MatIconButtonCustomDirective,
    forwardRef(() => OverFlowTooltipDirective),
    materialModules.matMenuModule,
    materialModules.matTreeModule,
    materialModules.matProgressSpinnerModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    materialModules.matButtonModule,
  ],
  templateUrl: './passports-tree.component.html',
  styleUrl: './passports-tree.component.scss',
})
export class PassportsTreeComponent {
  @Input() interactive: boolean = true;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  getLevel = (node: PassportFlatNode) => node.level;
  isExpandable = (node: PassportFlatNode) => node.expandable;
  hasChild = (_: number, _nodeData: PassportFlatNode) => _nodeData.expandable;

  treeControl: FlatTreeControl<PassportFlatNode> = new FlatTreeControl<PassportFlatNode>(
    this.getLevel,
    this.isExpandable,
  );

  dataSource: PassportTreeData | null = null;

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private passportsTreeService: PassportsTreeService,
    private notificationsService: NotificationsService,
    private sessionStorageService: SessionStorageService,
  ) {
    this.dataSource = new PassportTreeData(
      this.treeControl,
      this.passportsTreeService,
      this.notificationsService,
      this.sessionStorageService,
    );
  }
  get initLoading() {
    return this.passportsTreeService.initLoading;
  }
  get treeExpanding() {
    return this.passportsTreeService.treeExpanding;
  }
  get currentNode() {
    return this.passportsTreeService.currentNode;
  }

  selectNode(node: PassportFlatNode) {
    if (!this.interactive) {
      return;
    }
    if (!node.selectable) {
      return;
    }
    this.passportsTreeService.currentNode = node;
    this.sessionStorageService.set(SELECTED_PASSPORT_NODE_KEY, JSON.stringify(node));
    this.passportsTreeService.setNavigationUid(node.id);
  }

  onSearchValueChanged(value: string) {}
  loadTree() {
    this.passportsTreeService.initLoading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.passportsTreeService
      .loadTree()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.passportsTreeService.initLoading = false)),
      )
      .subscribe((response) => {
        if (response.error) {
          this.errorCode = +response;
          this.errorMessage = String(response);
          return;
        }
        if (!this.dataSource) {
          return;
        }
        const result: PassportNode[] = response.result.childrenList.map((item) => ({
          id: item.uid,
          parent: item.parentUid,
          hasChildren: item.hasChildren,
          level: 0,
          title: item.name,
          type: item.tagClass,
          passport: item.passport,
        }));
        this.dataSource.data = getCalculatedPassportNodes(result);
        if (
          this.passportsTreeService.selectedUID &&
          this.passportsTreeService.currentNode?.id !== this.passportsTreeService.selectedUID
        ) {
          this.expandRecursive(this.passportsTreeService.selectedUID);
        }
      });
  }
  private expandRecursive(uid: string) {
    this.passportsTreeService
      .getPathFromRoot(uid)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (response.error) {
          const message = getErrorsMessage(response.error) || 'Ошибка раскрытия дерева';
          this.notificationsService.displayMessage('Ошибка', message, 'error', 3000);
          return;
        }
        response.result.splice(0, 1);
        this.passportsTreeService.treeExpanding = true;
        this.expandChildren(response.result);
      });
  }
  private expandChildren(uidList: string[]) {
    if (!uidList.length && this.passportsTreeService.selectedUID) {
      this.passportsTreeService.currentNode =
        this.dataSource?.data.find((item) => item.id === this.passportsTreeService.selectedUID) || null;

      const element = document.getElementById(this.passportsTreeService.selectedUID);
      const tree = document.querySelector('.tree');
      if (!tree || !element) {
        this.passportsTreeService.treeExpanding = false;
      } else {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        let treeScrolled = false;
        const scrollListener = () => {
          treeScrolled = true;
          tree.addEventListener('scrollend', () => {
            this.passportsTreeService.treeExpanding = false;
          });
          tree.removeEventListener('scroll', scrollListener);
        };
        tree.addEventListener('scroll', scrollListener);

        setTimeout(() => {
          if (!treeScrolled) {
            this.passportsTreeService.treeExpanding = false;
          }
        }, 1000);
      }
      return;
    }
    const destroy$: ReplaySubject<void> = new ReplaySubject<void>();
    const id = uidList.shift();
    const node = this.dataSource?.data.find((item) => item.id === id);
    if (!node) {
      this.passportsTreeService.treeExpanding = false;
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

    this.passportsTreeService.expanded$.pipe(takeUntil(destroy$), debounceTime(300)).subscribe((value) => {
      if (value) {
        destroy$.next();
        destroy$.complete();
        this.passportsTreeService.expanded = false;
        this.expandChildren(uidList);
      }
    });
  }
  ngOnInit() {
    this.loadTree();
    this.passportsTreeService.reloadTree$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (value) {
        this.loadTree();
      }
    });
    this.passportsTreeService.selectedUID$.pipe(takeUntil(this.destroy$)).subscribe((uid) => {
      if (!this.dataSource?.data.length) {
        return;
      }
      if (!uid) {
        return;
      }
      if (uid === this.passportsTreeService.currentNode?.id) {
        return;
      }
      this.expandRecursive(uid);
    });
  }
  ngOnDestroy() {
    this.sessionStorageService.set(SELECTED_PASSPORT_NODE_KEY, null);
    this.destroy$.next();
    this.destroy$.complete();
    if (this.passportsTreeService.treeExpanding) {
      this.passportsTreeService.treeExpanding = false;
    }
  }
}
