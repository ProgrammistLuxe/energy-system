import { CommonModule } from '@angular/common';
import { Component, NgZone } from '@angular/core';
import { NavigatorService } from '../../services/navigator.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AppConfigService, NotificationsService } from '@services';
import { materialModules } from '@shared/materials';
import { Graph, GraphData, NodeData } from '@antv/g6';
import { ReplaySubject, finalize, mergeMap, of, takeUntil } from 'rxjs';
import { ApiResolverComponent, ConfirmDialogComponent, DialogService, EmptyTemplateComponent } from '@shared/index';
import { FormsModule } from '@angular/forms';
import { GetAttributesData, Names } from '@api-calls/services/http-graph-service/models';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { Clipboard } from '@angular/cdk/clipboard';
import { uid } from '@core/utils/uid';

const CONTAINER_WIDTH = 2400;
const CONTAINER_HEIGHT = 1400;

export interface GraphNodeData {
  id: string;
  uid: string | null;
  value: string | null;
  label: string;
  library: boolean;
  showAddIcon: boolean;
  showRemoveIcon: boolean;
  parentId?: string | null;
}
@Component({
  selector: 'app-graph-view',
  imports: [
    CommonModule,
    ApiResolverComponent,
    FormsModule,
    EmptyTemplateComponent,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matFormFieldModule,
    materialModules.matSelectModule,
    materialModules.matOptionModule,
    materialModules.matTooltipModule,
    materialModules.matIconModule,
  ],
  templateUrl: './graph-view.component.html',
  styleUrl: './graph-view.component.scss',
})
export class GraphViewComponent {
  depth: number = 1;
  loading: boolean = false;
  errorCode: number | null = null;
  errorMessage: string | null = null;
  graphData: GraphData = {
    nodes: [],
    edges: [],
  };
  childrenLoad: boolean = false;
  private graph: Graph | null = null;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private graph_context: string = this.appConfigService.config['GRAPH_CONTEXT'];
  private isDragging: boolean = false;
  constructor(
    private navigatorService: NavigatorService,
    private appConfigService: AppConfigService,
    private notificationsService: NotificationsService,
    private route: ActivatedRoute,
    private router: Router,
    private dialogService: DialogService,
    private clipboard: Clipboard,
  ) {}
  private copyUid(uid: string | null) {
    if (!uid) {
      return;
    }
    const cropString = this.graph_context + '#_';
    const croppedUid = uid.replace(cropString, '');
    this.clipboard.copy(String(croppedUid));
    this.notificationsService.displayMessage('Успех', 'Uid успешно скопированно в буфер обмена', 'success', 3000);
  }
  async downloadPng() {
    const dataURL = await this.graph?.toDataURL({ mode: 'overall' });
    if (!dataURL) {
      this.notificationsService.displayMessage('Ошибка', 'На графе нет данных', 'error');
      return;
    }
    const [head, content] = dataURL.split(',');

    const contentType = head.match(/:(.*?);/);
    if (!contentType?.length) {
      this.notificationsService.displayMessage('Ошибка', 'Ошибка скачивания', 'error');
      return;
    }
    const type = contentType[1];

    const bstr = atob(content);
    let length = bstr.length;
    const u8arr = new Uint8Array(length);

    while (length--) {
      u8arr[length] = bstr.charCodeAt(length);
    }

    const blob = new Blob([u8arr], { type: type });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = this.navigatorService.selectedNode?.name || 'Граф';
    a.download = name + '.png';
    a.click();
  }
  loadGraph() {
    this.errorCode = null;
    this.errorMessage = null;
    this.graphData = {
      nodes: [],
      edges: [],
    };
    const uid = this.navigatorService.selectedUid;
    if (!uid) {
      return;
    }
    this.loading = true;

    this.navigatorService
      .getGraphAttributesLength(uid)
      .pipe(
        takeUntil(this.destroy$),
        mergeMap((response) => {
          if (response.error) {
            this.errorCode = +response;
            this.errorMessage = String(response);
            return of(null);
          }
          if (response.result.data.length > 300) {
            const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
              title: 'Подтверждение',
              data: `Вы уверены, что хотите отобразить элементы в количестве ${response.result.data.length} ?`,
            });
            return dialogRef.afterClosed();
          }
          return of('load');
        }),
        mergeMap((response) => {
          if (response === 'load') {
            return this.navigatorService.getGraphAttributes(uid);
          }
          if (!response) {
            return of(null);
          }
          return this.navigatorService.getGraphAttributes(uid);
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe((res) => {
        if (!res) {
          return;
        }
        if (res.error) {
          this.errorCode = +res;
          this.errorMessage = String(res);
        } else {
          this.loadGraphData(res.result);
        }
      });
  }

  private loadGraphData(res: GetAttributesData) {
    const element: Names | undefined = res.names.find((item) => item.label === 'name');
    const name = element?.value || '--';
    const parentId = uid();

    this.graphData.nodes?.push({
      id: parentId,
      data: {
        id: parentId,
        label: res.type,
        value: name,
        uid: res.uid,
        library: false,
        showAddIcon: false,
        showRemoveIcon: false,
      },
      style: {
        x: CONTAINER_WIDTH / 2,
        y: CONTAINER_HEIGHT / 2,
      },
    });
    let index = 2;
    const length = res.links.reduce((acc, item) => {
      acc += item.data.length;
      return acc;
    }, 0);
    res.links.forEach((link) => {
      link.data.forEach((item) => {
        const coords = this.getCoords(CONTAINER_WIDTH / 2, CONTAINER_HEIGHT / 2, index, length);
        index++;
        const nodeId = uid();
        this.graphData.nodes?.push({
          id: nodeId,
          data: {
            id: nodeId,
            label: link.label,
            value: item.value,
            uid: item.uid || uid(),
            library: link.library,
            showAddIcon: !!item.uid,
            showRemoveIcon: false,
          },
          style: {
            x: coords.x,
            y: coords.y,
          },
        });
        this.graphData.edges?.push({
          source: parentId,
          target: nodeId,
          style: {
            labelText: link.predicate,
          },
        });
      });
    });

    setTimeout(() => {
      this.initGraph();
    });
  }
  private removeNodes(node: NodeData) {
    if (node.data) {
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          showAddIcon: true,
          showRemoveIcon: false,
        },
      };
      this.graph?.updateNodeData([updatedNode]);
      this.graph?.draw();
      const nodes = this.graph?.getNodeData().filter((item) => item.data?.['parentId'] === node.id) || [];
      const edges = this.graph?.getEdgeData().filter((item) => item.source === node.id) || [];
      const nodeIds = nodes.map((node) => node.id);
      const edgeIds = edges.map((node) => node.id || '');
      this.graph?.removeData({
        nodes: nodeIds,
        edges: edgeIds,
      });
      this.graph?.draw().then(() => {
        this.setNodeEvents([node]);
      });
    }
  }
  private insertNodes(id: string, node_id: string) {
    this.childrenLoad = true;
    this.navigatorService
      .getGraphAttributesLength(id)
      .pipe(
        takeUntil(this.destroy$),
        mergeMap((response) => {
          if (response.error) {
            return of(null);
          }
          if (response.result.data.length > 100) {
            const dialogRef = this.dialogService.open(ConfirmDialogComponent, {
              title: 'Подтверждение',
              data: `Вы уверены, что хотите отобразить дочерние элементы в количестве ${response.result.data.length} ?`,
            });
            return dialogRef.afterClosed();
          }
          return of('load');
        }),
        mergeMap((response) => {
          if (response === 'load') {
            return this.navigatorService.getGraphAttributes(id);
          }
          if (!response) {
            return of(null);
          }
          return this.navigatorService.getGraphAttributes(id);
        }),
        finalize(() => (this.childrenLoad = false)),
      )
      .subscribe((res) => {
        if (!res) {
          return;
        }
        if (res.error) {
          const message = getErrorsMessage(res.error) || 'Ошибка получения дочерних элементов';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
          return;
        }

        const node = this.graph?.getNodeData().find((node) => node.id === node_id);
        if (!node) {
          return;
        }
        this.changeGraphData(res.result, node);
      });
  }
  private getCoords(x: number | undefined, y: number | undefined, index: number, length: number) {
    if (!x || !y) {
      return { x: 0, y: 0 };
    }
    let itemX = 0;
    let itemY = 0;
    const limit = 40;
    let xConst: number = 1;
    let yConst: number = limit;
    const maxLength = length * limit;

    for (let i = 2000; i < maxLength; i += 2000) {
      if (index * limit < i) {
        const calculatedX = xConst + i / 2000;
        const calculatedY = yConst - i / 2000;

        if (calculatedX >= 1 && calculatedX <= limit && calculatedY >= 1 && calculatedY <= limit) {
          yConst = calculatedX;
          xConst = calculatedY;
          break;
        }
      }
    }

    itemY = index % 2 === 0 ? y + 80 + yConst * index : y - 80 - yConst * index;
    itemX = index % 2 === 0 ? x + xConst * 240 : x - xConst * 240;
    return { x: itemX, y: itemY };
  }
  private changeGraphData(res: GetAttributesData, node: NodeData) {
    if (node.data) {
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          showAddIcon: false,
          showRemoveIcon: true,
        },
      };
      this.graph?.updateNodeData([updatedNode]);
      this.graph?.draw();
    }
    const newData: GraphData = {
      nodes: [],
      edges: [],
    };
    let index = 2;
    const length = res.links.reduce((acc, item) => {
      acc += item.data.length;
      return acc;
    }, 0);

    res.links.forEach((link) => {
      link.data
        .filter((item) => !this.graphData.nodes?.map((node) => node.id).includes(item.uid))
        .forEach((item) => {
          const alreadyInGraph = this.graphData.nodes?.some((el) => {
            if (!el.data?.['uid'] && !item.uid) {
              return false;
            }
            return el.data?.['uid'] === item.uid;
          });
          if (alreadyInGraph) {
            return;
          }
          const coords = this.getCoords(node.style?.x, node.style?.y, index, length);
          index++;
          const nodeId = uid();
          newData.nodes?.push({
            id: nodeId,
            data: {
              id: nodeId,
              label: link.label,
              value: item.value,
              uid: item.uid,
              library: link.library,
              showAddIcon: !!item.uid,
              showRemoveIcon: false,
              parentId: node.id,
            },
            style: {
              x: coords.x,
              y: coords.y,
            },
          });
          newData.edges?.push({
            source: node.id,
            target: nodeId,
            style: {
              labelText: link.predicate,
            },
          });
        });
    });

    this.graph?.addData(newData);
    this.graph?.draw().then(() => {
      this.setNodeEvents([node, ...(newData.nodes || [])]);
    });
  }
  private initGraph() {
    if (this.graph) {
      this.graph.clear();
      this.graph.destroy();
    }
    this.graph = new Graph({
      container: 'container',
      width: CONTAINER_WIDTH,
      height: CONTAINER_HEIGHT,
      animation: false,
      node: {
        type: 'html',
        style: {
          size: [300, 120],
          dx: -150,
          dy: -60,
          innerHTML: (d: { data: GraphNodeData }) => {
            const {
              data: { id, uid, library, value, label, showAddIcon, showRemoveIcon },
            } = d;
            let iconSrc = '';
            if (showAddIcon) {
              iconSrc = '/assets/images/plus.svg';
            }
            if (showRemoveIcon) {
              iconSrc = '/assets/images/minus.png';
            }
            const logoIconUrl = library ? '/assets/images/reference.png' : '/assets/images/graph.png';
            const data = `
              <div id="node_${id}" class="node">
                <div class="logo-icon-block">
                  <img class="logo-icon" src="${logoIconUrl}" />
                </div>
                <div class="content">
                  <h3 class="header">${label}</h3>
                  <p id="description_${id}" class="description">${value || '--'}</p>
                    ${
                      uid
                        ? `<div class="uid-data">
                             <p  id="uid_${id}" class="uid">${uid}</p>
                             <mat-icon class="icon-copy material-symbols-outlined" id="copy_${id}">content_copy</mat-icon>
                           </div>`
                        : ''
                    }
                </div>
                ${
                  uid && (showAddIcon || showRemoveIcon)
                    ? `<div class="icon-data">
                         <img id="action_icon_${id}" class="icon-data-block" src="${iconSrc}"/> 
                       </div>`
                    : ''
                }
                
              </div>
  `;
            return data;
          },
        },
      },
      edge: {
        style: {
          radius: 5,
          labelFill: 'white',
          labelFontSize: 14,
          stroke: 'white',
          lineWidth: 1,
          fillOpacity: 1,
          endArrow: true,
          labelBackground: true,
          labelBackgroundFill: '#101418',
          labelBackgroundOpacity: 1,
          labelBackgroundFillOpacity: 1,
        },
      },
      behaviors: [
        'drag-canvas',
        'drag-element',
        'zoom-canvas',
        {
          type: 'tooltip',
          formatText: function formatText(model: any) {
            const text = model?.descriptionFull || '';
            return text;
          },
          offset: 30,
          shouldBegin: (e: any) => {
            if (!e.item) {
              return false;
            }
            const target = e.target;
            if (target.get('name') === 'rect-description') return true;
            return false;
          },
        },
      ],
    });

    this.graph.setData(this.graphData);
    this.graph.render().then(() => {
      this.setNodeEvents(this.graph?.getNodeData());
      this.graph?.zoomTo(0.7, undefined, [0, 0]);
    });

    this.graph.on('node:dragstart', (e) => {
      this.isDragging = true;
    });
    this.graph.on('node:drag', (e) => {
      this.isDragging = true;
    });
    this.graph.on('node:dragend', (e) => {
      setTimeout(() => {
        this.isDragging = false;
      }, 100);
    });
  }
  private setNodeEvents(data: NodeData[] | undefined) {
    data?.forEach((node) => {
      const id = node.id;
      const desc = <string | null>node.data?.['value'] || '--';
      const uid = <string | null>node.data?.['uid'] || null;
      document.getElementById(`copy_${id}`)?.setAttribute('title', 'Копировать uid');
      document.getElementById(`copy_${id}`)?.setAttribute('data-toggle', 'tooltip');

      document.getElementById(`description_${id}`)?.setAttribute('title', desc);
      document.getElementById(`description_${id}`)?.setAttribute('data-toggle', 'tooltip');

      document.getElementById(`uid_${id}`)?.setAttribute('title', uid || '');
      document.getElementById(`uid_${id}`)?.setAttribute('data-toggle', 'tooltip');

      document.getElementById(`node_${id}`)?.addEventListener('click', () => {
        if (!uid || this.isDragging) {
          return;
        }
        if (uid.includes(this.graph_context) && !this.isDragging) {
          this.router.navigate(['../../', uid, 'edit'], { relativeTo: this.route });
        }
      });
      document.getElementById(`action_icon_${id}`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!uid || this.isDragging) {
          return;
        }
        if (node.data?.['showAddIcon']) {
          this.insertNodes(uid, id);
        } else if (node.data?.['showRemoveIcon']) {
          this.removeNodes(node);
        }
      });

      document.getElementById(`copy_${id}`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!uid || this.isDragging) {
          return;
        }
        this.copyUid(uid);
      });
    });
  }
  ngAfterViewInit() {
    this.navigatorService.selectedUid$.pipe(takeUntil(this.destroy$)).subscribe((uid) => {
      if (!uid) {
        return;
      }
      this.loadGraph();
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
