import { FlatTreeControl } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { ActivatedRoute, Router } from '@angular/router';
import { PassportTemplatesService } from '@pages/architect/passport-templates/services/passport-templates.service';
import {
  AddButtonDirective,
  ApiResolverComponent,
  EmptyTemplateComponent,
  MatIconButtonCustomDirective,
  SearchFieldComponent,
  materialModules,
  DeleteConfirmDialogTemplateComponent,
  DialogService,
  OverFlowTooltipDirective,
} from '@shared/index';
import { NotificationsService, SessionStorageService } from '@services';
import { ReplaySubject, filter, finalize, takeUntil } from 'rxjs';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { AddFolderComponent } from '@pages/architect/passport-templates/components/add-folder/add-folder.component';
import { TemplatesTreeData } from '../../utils/templates-tree-data';
import { TemplateFlatNode } from '../../models';
import { getCalculatedTemplateNodes } from '../../utils/templateFlatNodeMapper';
import { PassTemplateNode } from '../../models/pass-template-node.models';
import { EditFolderComponent } from '../../components/edit-folder/edit-folder.component';
import {
  GetPassTemplate,
  GetPassTemplateDraft,
  PostPassTemplate,
  PostPassTemplateDraftReq,
} from '@api-calls/services/http-passport-templates/models';
import { SELECTED_NODE_KEY } from '../../consts';

@Component({
  selector: 'app-passport-templates-tree',
  imports: [
    CommonModule,
    AddButtonDirective,
    SearchFieldComponent,
    ApiResolverComponent,
    EmptyTemplateComponent,
    MatIconButtonCustomDirective,
    OverFlowTooltipDirective,
    materialModules.matMenuModule,
    materialModules.matTreeModule,
    materialModules.matProgressSpinnerModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    materialModules.matButtonModule,
  ],
  templateUrl: './passport-templates-tree.component.html',
  styleUrl: './passport-templates-tree.component.scss',
})
export class PassportTemplatesTreeComponent {
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;

  getLevel = (node: TemplateFlatNode) => node.level;
  isExpandable = (node: TemplateFlatNode) => node.expandable;
  hasChild = (_: number, _nodeData: TemplateFlatNode) => _nodeData.expandable;

  treeControl: FlatTreeControl<TemplateFlatNode> = new FlatTreeControl<TemplateFlatNode>(
    this.getLevel,
    this.isExpandable,
  );

  dataSource: TemplatesTreeData | null = null;

  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();

  constructor(
    private passportTemplatesService: PassportTemplatesService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private notificationsService: NotificationsService,
    private clipboard: Clipboard,
    private sessionStorageService: SessionStorageService,
  ) {
    this.dataSource = new TemplatesTreeData(
      this.treeControl,
      this.passportTemplatesService,
      this.notificationsService,
      this.sessionStorageService,
    );
  }
  get currentNode() {
    return this.passportTemplatesService.currentNode;
  }

  selectNode(node: TemplateFlatNode) {
    switch (node.type) {
      case 'folder':
        return;
      case 'template': {
        this.passportTemplatesService.currentNode = node;
        this.sessionStorageService.set(SELECTED_NODE_KEY, JSON.stringify(node));
        this.router.navigate([node.id], { relativeTo: this.route });
        break;
      }
      case 'draft': {
        this.passportTemplatesService.currentNode = node;
        this.sessionStorageService.set(SELECTED_NODE_KEY, JSON.stringify(node));
        this.router.navigate(['./draft', node.id], { relativeTo: this.route });
        break;
      }
    }
  }

  onSearchValueChanged(value: string) {}
  loadTree() {
    this.loading = true;
    this.errorCode = null;
    this.errorMessage = null;
    this.passportTemplatesService
      .loadTree()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
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
        const result: PassTemplateNode[] = response.result
          .filter((node) => !node.level)
          .map((item) => ({
            id: item.id,
            parent: item.parent,
            hasChildren: true,
            level: item.level,
            title: item.title,
            type: 'folder',
          }));
        this.dataSource.data = getCalculatedTemplateNodes(result);
        this.expandSelectedNodeRecursive();
      });
  }

  createChildFolder(node: TemplateFlatNode) {
    const dialogRef = this.dialogService.open<AddFolderComponent>(AddFolderComponent, {
      title: 'Добавить папку',
      width: '480px',
      autoFocus: false,
      data: {
        parent: node.id,
        level: node.level,
      },
    });
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.loadTree();
      });
  }
  createParentFolder() {
    const dialogRef = this.dialogService.open<AddFolderComponent>(AddFolderComponent, {
      title: 'Добавить папку',
      width: '480px',
      autoFocus: false,
      data: {
        parent: 0,
      },
    });
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.loadTree();
      });
  }
  editFolder(node: TemplateFlatNode) {
    const dialogRef = this.dialogService.open<EditFolderComponent>(EditFolderComponent, {
      title: 'Обновить папку',
      width: '480px',
      autoFocus: false,
      data: {
        id: node.id,
        parent: node.parent,
        title: node.title,
      },
    });
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.loadTree();
      });
  }
  deleteFolder(node: TemplateFlatNode) {
    const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
      DeleteConfirmDialogTemplateComponent,
      {
        title: 'Удалить папу',
        data: `Вы уверены хотите удалить папку, "${node.title}"?`,
      },
    );
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.passportTemplatesService
          .deleteFolder(node.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (!!response.error) {
              const errorMessage = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
              return;
            }
            this.notificationsService.displayMessage('Успешно', 'Папка успешно удалена', 'success', 3000);
            if (node.id === this.currentNode?.id) {
              this.passportTemplatesService.currentNode = null;
              this.router.navigate(['./'], { relativeTo: this.route });
            }
            this.loadTree();
          });
      });
  }
  deleteTemplate(node: TemplateFlatNode) {
    const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
      DeleteConfirmDialogTemplateComponent,
      {
        title: 'Удалить шаблон',
        data: `Вы уверены хотите удалить шаблон, "${node.title}"?`,
      },
    );
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.passportTemplatesService
          .deletePassportTemplate(node.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (!!response.error) {
              const errorMessage = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
              return;
            }
            this.notificationsService.displayMessage('Успешно', 'Шаблон успешно удален', 'success', 3000);
            if (node.id === this.currentNode?.id) {
              this.passportTemplatesService.currentNode = null;
              this.sessionStorageService.set(SELECTED_NODE_KEY, null);
              this.router.navigate(['./'], { relativeTo: this.route });
            }
            this.loadTree();
          });
      });
  }
  deleteDraft(node: TemplateFlatNode) {
    const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
      DeleteConfirmDialogTemplateComponent,
      {
        title: 'Удалить черновик',
        data: `Вы уверены хотите удалить черновик, "${node.title}"?`,
      },
    );
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.passportTemplatesService
          .deleteDraft(node.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((response) => {
            if (!!response.error) {
              const errorMessage = getErrorsMessage(response.error) || 'Ошибка удаления';
              this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
              return;
            }
            this.notificationsService.displayMessage('Успешно', 'Черновик успешно удален', 'success', 3000);
            if (node.id === this.currentNode?.id) {
              this.passportTemplatesService.currentNode = null;
              this.sessionStorageService.set(SELECTED_NODE_KEY, null);
              this.router.navigate(['./'], { relativeTo: this.route });
            }
            this.loadTree();
          });
      });
  }
  deleteNode(node: TemplateFlatNode) {
    switch (node.type) {
      case 'draft':
        this.deleteDraft(node);
        break;
      case 'folder':
        this.deleteFolder(node);
        break;
      case 'template':
        this.deleteTemplate(node);
        break;
    }
  }
  createTemplate(node: TemplateFlatNode) {
    this.passportTemplatesService.currentNode = null;
    this.sessionStorageService.set(SELECTED_NODE_KEY, null);
    this.router.navigate(['./create', node.id], { relativeTo: this.route });
  }
  pasteNode(node: TemplateFlatNode) {
    navigator['clipboard'].readText().then((data) => {
      try {
        if (!data) {
          return;
        }
        const buff = JSON.parse(data) as { node: GetPassTemplate | GetPassTemplateDraft; type: 'draft' | 'template' };
        if (typeof buff !== 'object' || !buff) {
          throw new Error();
        }
        switch (buff.type) {
          case 'draft':
            this.pasteDraft(buff.node, node);
            break;
          case 'template':
            this.pasteTemplate(buff.node, node);
            break;
        }
      } catch {
        this.notificationsService.displayMessage('Ошибка', 'У вас нет ни одной скопированной сущности', 'error');
      }
    });
  }
  pasteDraft(buff: GetPassTemplateDraft, node: TemplateFlatNode) {
    node.loading = true;
    const reqData: PostPassTemplateDraftReq = {
      title: buff.title,
      folder: node.id,
      attribute: buff.attribute,
      attribute_type: buff.attribute_type,
    };
    this.passportTemplatesService
      .createDraft(reqData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (node.loading = false)),
      )
      .subscribe((res) => {
        if (res.error) {
          this.notificationsService.displayMessage('Ошибка', 'Ошибка вставки', 'error');
        } else {
          this.loadTree();
        }
      });
  }
  pasteTemplate(buff: GetPassTemplate, node: TemplateFlatNode) {
    node.loading = true;
    const reqData: PostPassTemplate = {
      title: buff.title,
      folder: node.id,
      attribute: buff.attribute,
      attribute_type: buff.attribute_type,
    };
    this.passportTemplatesService
      .createTreeTemplate(reqData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (node.loading = false)),
      )
      .subscribe((res) => {
        if (res.error) {
          this.notificationsService.displayMessage('Ошибка', 'Ошибка вставки', 'error');
        } else {
          this.loadTree();
        }
      });
  }
  copyNode(node: TemplateFlatNode) {
    switch (node.type) {
      case 'folder':
        return;
      case 'draft':
        this.copyDraft(node);
        break;
      case 'template':
        this.copyTemplate(node);
        break;
    }
  }
  copyDraft(node: TemplateFlatNode) {
    node.loading = true;
    this.passportTemplatesService
      .getDraft(node.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (node.loading = false)),
      )
      .subscribe((data) => {
        if (!data.error) {
          this.clipboard.copy(JSON.stringify({ node: data.result, type: 'draft' }));
          this.notificationsService.displayMessage('Успех', 'Успешно скопированно в буфер обмена', 'success', 3000);
        } else {
          const errorMessage = getErrorsMessage(data.error) || 'Ошибка копирования';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  copyTemplate(node: TemplateFlatNode) {
    node.loading = true;
    this.passportTemplatesService
      .getTemplateById(node.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (node.loading = false)),
      )
      .subscribe((data) => {
        if (!data.error) {
          this.clipboard.copy(JSON.stringify({ node: data.result, type: 'template' }));
          this.notificationsService.displayMessage('Успех', 'Успешно скопированно в буфер обмена', 'success', 3000);
        } else {
          const errorMessage = getErrorsMessage(data.error) || 'Ошибка копирования';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        }
      });
  }
  private expandSelectedNodeRecursive() {
    const selected_node: TemplateFlatNode = this.sessionStorageService.get(SELECTED_NODE_KEY);
    if (!selected_node) {
      return;
    }
    const node = this.expandParentNode(selected_node.parent);
    if (node && this.treeControl.isExpanded(node)) {
      return;
    }
    this.getParentAndExpand(selected_node.parent);
  }
  private getParentAndExpand(nodeId: number) {
    this.passportTemplatesService
      .getTreeFolderById(nodeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.error) {
          return;
        }
        const parent = this.treeControl.dataNodes.find((item) => item.id === res.result.parent);
        if (!parent) {
          this.getParentAndExpand(res.result.parent);
        }
        this.expandParentNode(res.result.parent);
      });
    this.passportTemplatesService.expanded$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (!value) {
        return;
      }
      this.expandParentNode(nodeId);
    });
  }
  private expandParentNode(id: number) {
    const selected_node = this.treeControl.dataNodes.find((item) => item.id === id);
    if (selected_node) {
      this.treeControl.expand(selected_node);
    }
    return selected_node;
  }
  ngOnInit() {
    this.passportTemplatesService.reloadTree$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (value) {
        this.loadTree();
      }
    });
    this.loadTree();
  }
  ngOnDestroy() {
    this.sessionStorageService.set(SELECTED_NODE_KEY, null);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
