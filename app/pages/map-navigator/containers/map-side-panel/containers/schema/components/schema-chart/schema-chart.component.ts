import { CommonModule } from '@angular/common';
import { Component, Input, ElementRef, ViewChild, HostListener } from '@angular/core';
import { dia, shapes, g, util } from '@joint/core';
import { JsonLdConverterService } from '../../services/jsonLdConverter.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { NotificationsService } from '@services';
import { ChangeQueueService } from '../../services/change-queue';
import { BehaviorSubject, Observable, ReplaySubject, interval, take, takeUntil } from 'rxjs';
import { ActionBarComponent } from '../../components/action-bar/action-bar.component';
import { EnergyElementIcon } from '@api-calls/services/http-icons-service/models';
import { DialogService } from '@shared/services';
import { ElementDataDialogComponent } from '../../components/element-data-dialog/element-data-dialog.component';
import { LoadingComponent } from '@shared/components';
import { getRandomBetween } from '@core/utils/get-random-between';
import { SchemasService } from '../../services/schemas.service';
import jsPDF from 'jspdf';
import { materialModules } from '@shared/materials';
import { SchemasFooterComponent } from '../schemas-footer/schemas-footer.component';
import { PassportsTreeService } from '@features/passports-tree/services/passports-tree.service';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';

const convertJsonLdWorker = new Worker(new URL('../../convert-json-ld/convert-json-ld.worker', import.meta.url), {
  name: 'json-ld',
  type: 'module',
});

const PAPER_WIDTH = 7000;
const PAPER_HEIGHT = 7000;
@Component({
  selector: 'app-passport-schema-chart',
  imports: [
    CommonModule,
    ActionBarComponent,
    LoadingComponent,
    SchemasFooterComponent,
    materialModules.matIconModule,
    materialModules.matButtonModule,
    materialModules.matTooltipModule,
  ],
  providers: [ChangeQueueService, JsonLdConverterService],
  templateUrl: './schema-chart.component.html',
  styleUrl: './schema-chart.component.scss',
})
export class SchemaChartComponent {
  @Input() schemaData: string = '';
  @ViewChild('canvas') canvas: ElementRef | null = null;
  @ViewChild('paperWrapper') wrapper: ElementRef | null = null;
  @HostListener('wheel', ['$event']) onMouseWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = Math.sign(event.deltaY);
      this.zoomOnMouseWheel(delta);
    }
  }
  loading: boolean = false;
  scale: number = 1;
  minScale: number = 0.1;
  maxScale: number = 3;
  private isMoving: boolean = false;
  private isCellTarget: boolean = false;
  private scrollLeft: number = 0;
  private scrollTop: number = 0;
  private xPosition: number = 0;
  private yPosition: number = 0;
  private graph: dia.Graph;
  private paper: dia.Paper;
  private selectedElement: Element | null = null;
  private graphSelectedElement: any = null;
  private selectedGroup: (dia.Element | dia.Link | dia.Cell)[] = [];
  private selectedGroupElement: dia.Element | null = null;
  private currentJsonData: Record<string, any>[] = [];
  private elChangePos: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private removeAll: boolean = false;
  constructor(
    private clipboard: Clipboard,
    private notificationsService: NotificationsService,
    private jsonLdConverterService: JsonLdConverterService,
    private changeQueue: ChangeQueueService,
    private schemasService: SchemasService,
    private dialogService: DialogService,
    private passportsTreeService: PassportsTreeService,
  ) {}

  clearGraph() {
    this.removeAll = true;
    const graphCopy = this.graph.toJSON();
    this.graph.clear();
    this.changeQueue.pushEvent({ type: 'removeAll', event: { graphCopy: graphCopy, graph: this.graph } });
    this.removeAll = false;
  }
  exportPng() {
    const size = this.paper.svg.querySelector('.joint-viewport')?.getBoundingClientRect() ?? {
      width: PAPER_WIDTH,
      height: PAPER_HEIGHT,
    };

    this.inlineImages()
      .then(() => {
        let svgData = new XMLSerializer().serializeToString(this.paper.svg);
        svgData = svgData.replace('inset: 0px', 'background-color: #1c2024');
        const canvas = document.createElement('canvas');
        canvas.width = size.width + 100;
        canvas.height = size.height + 100;
        const context = canvas.getContext('2d');
        const image = new Image();
        if (!context) {
          return;
        }
        context.fillStyle = context.createPattern(image, 'repeat') || '';
        context.fillRect(0, 0, canvas.width, canvas.height);
        image.onload = () => {
          context.drawImage(image, 0, 0);
          const link = document.createElement('a');
          link.download = this.getSchemaName() + '.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          link.remove();
        };
        image.onerror = () => {
          this.notificationsService.displayMessage('Ошибка экспорта', 'Не удалось экспортировать схему', 'error', 3000);
        };
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
      })
      .catch(() => {
        this.notificationsService.displayMessage('Ошибка экспорта', 'Не удалось экспортировать схему', 'error', 3000);
      });
  }

  exportSvg() {
    const paperSvg = this.paper.svg;
    paperSvg.setAttribute('width', `${PAPER_WIDTH}px`);
    paperSvg.setAttribute('height', `${PAPER_HEIGHT}px`);
    paperSvg.style.background = '#1c2024';
    paperSvg.style.overflow = 'auto';
    const svgData = new XMLSerializer().serializeToString(this.paper.svg);
    const image64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
    const link = document.createElement('a');
    link.download = this.getSchemaName() + '.svg';
    link.href = image64;
    link.click();
    link.remove();
  }
  exportPdf() {
    const size = this.paper.svg.querySelector('.joint-viewport')?.getBoundingClientRect() ?? {
      width: PAPER_WIDTH,
      height: PAPER_HEIGHT,
    };
    this.inlineImages()
      .then(() => {
        let svgData = new XMLSerializer().serializeToString(this.paper.svg);
        svgData = svgData.replace('inset: 0px', 'background-color: #1c2024');
        const canvas = document.createElement('canvas');
        canvas.width = size.width + 100;
        canvas.height = size.height + 100;
        const context = canvas.getContext('2d');
        const image = new Image();
        if (!context) {
          return;
        }
        context.fillStyle = context.createPattern(image, 'repeat') || '';
        context.fillRect(0, 0, canvas.width, canvas.height);
        image.onload = () => {
          context.drawImage(image, 0, 0);
          const imgData = canvas.toDataURL('image/png');
          const pageWidth = 600;
          const pageHeight = 850;
          const pageMargin = 20;
          const doc = new jsPDF('p', 'pt', [pageWidth, pageHeight]);
          const imageMargin = 2;
          const y = 50;
          doc.addFont('assets/fonts/Roboto-Regular.ttf', 'Roboto', 'normal');
          doc.setFont('Roboto');
          doc.text(this.getSchemaName(), pageWidth / 2, y / 2, { align: 'center' });
          const imageRect = new g.Rect(0, 0, canvas.width, canvas.height);
          const maxImageRect = new g.Rect(0, 0, pageWidth - 2 * pageMargin, pageHeight - y - pageMargin);
          const scale = maxImageRect.maxRectUniformScaleToFit(imageRect, new g.Point(0, 0));
          const width = canvas.width * scale;
          const height = canvas.height * scale;
          const x = (pageWidth - width) / 2;
          doc.setDrawColor(211, 211, 211);
          doc.setFillColor('#1c2024');
          doc.setLineWidth(1);
          doc.roundedRect(
            x - imageMargin,
            y - imageMargin,
            width + 2 * imageMargin,
            height + 2 * imageMargin,
            2,
            2,
            'FD',
          );
          doc.addImage(imgData, 'PNG', x, y, width, height);
          const fileName = this.getSchemaName() + '.pdf';
          doc.save(fileName);
        };
        image.onerror = () => {
          this.notificationsService.displayMessage('Ошибка экспорта', 'Не удалось экспортировать схему', 'error', 3000);
        };
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
      })
      .catch(() => {
        this.notificationsService.displayMessage('Ошибка экспорта', 'Не удалось экспортировать схему', 'error', 3000);
      });
  }

  selectedElementChanged(element: Element) {
    this.selectedElement = element;
  }
  scaleChanged(scale: number) {
    this.scale = scale;
    this.paperScale(this.scale);
  }
  paperScale(scale: number) {
    this.paper.scale(scale, scale);
  }
  private zoomOnMouseWheel(delta: number) {
    const scaleToCheck: number = +this.scale.toFixed(1);

    if (delta > 0 && scaleToCheck > this.minScale) {
      this.scale -= 0.1;
      this.paperScale(this.scale);
      return;
    }
    if (delta < 0 && scaleToCheck < this.maxScale) {
      this.scale += 0.1;
      this.paperScale(this.scale);
      return;
    }
  }

  fullScreenToggle(): void {
    if (!this.wrapper) {
      return;
    }
    util.toggleFullScreen(this.wrapper.nativeElement);
  }
  private getSchemaName(): string {
    if (!this.passportsTreeService.currentNode) {
      return 'diagram';
    }
    return this.passportsTreeService.currentNode.title;
  }
  private addConnectionLine(element1: any, element2: any) {
    const link = new shapes.standard.Link();
    link.attr({
      line: {
        stroke: 'blue',
        strokeWidth: 5,
      },
    });
    link.source(element1);
    link.target(element2);
    this.graph.addCell(link);
  }
  private inlineImages() {
    return Promise.all(
      Array.from(this.paper.svg.querySelectorAll('image')).map((image) => {
        const href = image.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || image.getAttribute('href');
        if (!href) return Promise.resolve(null);

        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = href;
          img.onerror = function () {
            return reject(new Error('Could not load ' + href));
          };
          img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext('2d');
            if (!context) {
              return;
            }
            context.drawImage(img, 0, 0);
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', canvas.toDataURL('image/png'));
            resolve(true);
          };
        });
      }),
    );
  }
  private addElement(x: number, y: number) {
    // if (!this.selectedElement) {
    //   return;
    // }
    // const element = new shapes.standard.Image({
    //   position: { x, y },
    //   width: 20,
    //   height: 20,
    //   attrs: {
    //     image: {
    //       'xlink:href': `assets/energy-elements/${this.selectedElement?.icon}`,
    //       width: 20,
    //       height: 20,
    //     },
    //     label: {
    //       text: this.selectedElement?.type + 'тест',
    //       fontSize: 10,
    //       fill: 'yellow',
    //       refX: 0.5,
    //       refY: 0.5,
    //       yAlignment: 'center',
    //       xAlignment: 'center',
    //     },
    //     rdf: {
    //       id: uid(),
    //       classId: this.selectedElement?.id,
    //       type: this.selectedElement?.type,
    //       new: true,
    //     },
    //   },
    // });
    // this.graph.addCell(element);
  }
  private loadGraph() {
    this.graph = new dia.Graph({}, { cellNamespace: shapes });

    this.paper = new dia.Paper({
      model: this.graph,
      el: this.canvas?.nativeElement,
      background: {
        color: 'var(--bg)',
      },
      width: PAPER_WIDTH,
      height: PAPER_HEIGHT,
      maxWidth: PAPER_WIDTH,
      maxHeight: PAPER_HEIGHT,
      async: true,
      frozen: true,
      cellViewNamespace: shapes.standard,
      sorting: dia.Paper.sorting.APPROX,
      restrictTranslate: true,
      gridSize: 10,
      drawGrid: {
        name: 'fixedDot',
      },
      linkPinning: false,
      snapLinks: true,
      multiLinks: false,
      interactive: {
        linkMove: true,
        addLinkFromMagnet: true,
      },
      highlighting: {
        default: {
          name: 'addClass',
          options: {
            className: 'active',
          },
        },
      },
    });
    this.paper.unfreeze();
    this.changeQueue.init();
  }
  private loadSchemaFromJson() {
    this.graph.clear();
    const uidToReqList: string[] = [];
    let refreshTime: string = '';
    this.currentJsonData.map((data) => {
      if (!data?.['xPosition'] && !data['yPosition']) {
        data['unlinked'] = true;
      }
      const { x, y } = {
        x: data?.['xPosition'] ? Number(data?.['xPosition']) : getRandomBetween(50, 1000),
        y: data?.['yPosition'] ? Number(data?.['yPosition']) : getRandomBetween(50, 1000),
      };
      if (data?.['type'] === 'Terminal') {
        const element = new shapes.standard.Image({
          position: { x, y },
          size: { width: 1, height: 1 },
          attrs: {
            rdf: {
              id: data['id'],
              type: data['type'],
              sequenceNumber: data?.['sequenceNumber'],
              offsetX: data?.['offsetX'],
              offsetY: data?.['offsetY'],
              text: data?.['text'],
              DiagramObjectGluePoint: data?.['DiagramObjectGluePoint'],
              diagramObjectId: data?.['diagramObjectId'],
              parentObjectId: data?.['parentObjectId'],
              unlinked: data?.['unlinked'],
            },
          },
        });
        this.graph.addCell(element);
      }
      const icon = this.schemasService.iconList.find((icon) => data?.['ImgType'] === icon.its_image_type) ?? null;
      if (icon) {
        const element = new shapes.standard.Image({
          position: { x, y },
          size: { width: 30, height: 30 },
          attrs: {
            rdf: {
              id: data['id'],
              type: data['type'],
              sequenceNumber: data?.['sequenceNumber'],
              offsetX: data?.['offsetX'],
              offsetY: data?.['offsetY'],
              text: data?.['text'],
              DiagramObjectGluePoint: data?.['DiagramObjectGluePoint'],
              diagramObjectId: data?.['diagramObjectId'],
              parentObjectId: data?.['parentObjectId'],
              unlinked: data?.['unlinked'],
            },
          },
        });
        element.translate(-15, -15);
        element.attr('image', {
          'xlink:href': icon.image,
          refX: 30 * (data?.['offsetX'] ?? 0),
          refY: 30 * (data?.['offsetY'] ?? 0),
          yAlignment: 'center',
          xAlignment: 'center',
          size: { width: 30, height: 30 },
        });
        this.graph.addCell(element);
      }

      if (data?.['type'] === 'TextDiagramObject' && data?.['text']) {
        const element = new shapes.standard.Rectangle({
          position: { x, y },
          z: 2,
          size: { width: 80, height: 30 },
          attrs: {
            body: {
              stroke: 'transparent',
              fill: 'transparent',
              'stroke-dasharray': 0,
            },
            rdf: {
              id: data['id'],
              type: data['type'],
              sequenceNumber: data?.['sequenceNumber'],
              offsetX: data?.['offsetX'],
              offsetY: data?.['offsetY'],
              text: data?.['text'],
              DiagramObjectGluePoint: data?.['DiagramObjectGluePoint'],
              diagramObjectId: data?.['diagramObjectId'],
              parentObjectId: data?.['parentObjectId'],
              unlinked: data?.['unlinked'],
            },
          },
        });
        element.attr('label', {
          text: data?.['text'],
          fontSize: 14,
          fill: 'yellow',
        });
        if (data['isPanel'] && element.attributes.size) {
          element.attr({
            body: {
              stroke: 'purple',
              fill: 'transparent',
              'stroke-dasharray': 2,
            },
          });
          const wraptext = util.breakText(data?.['text'], {
            width: 160,
          });
          element.attr('label/text', wraptext);
          element.attr('rdf/syncUid', data['parentObjectId']);
          element.attr({
            label: {
              class: 'dynamic-info-label',
              fill: 'orange',
            },
          });
        }
        if (data['refreshTime'] && data['parentObjectId']) {
          uidToReqList.push(data['parentObjectId']);
          if (!refreshTime) {
            refreshTime = data['refreshTime'];
          }
        }
        if (data?.['rotation']) {
          element.rotate(data?.['rotation']);
        }
        this.graph.addCell(element);
      }
    });
    if (refreshTime && Number(refreshTime) > 0) {
      this.createRefreshInterval(uidToReqList, Number(refreshTime));
    }

    const connectionElements: Array<Array<dia.Cell>> = this.getCellsGroupArray('diagramObjectId', 'Terminal');
    const gluePoints: Array<Array<dia.Cell>> = this.getCellsGroupArray('DiagramObjectGluePoint');
    this.addGluePoints(gluePoints);
    connectionElements.forEach((cells: Array<dia.Cell>) => {
      this.addConnectionLines(cells);
    });
  }
  private createRefreshInterval(uidList: string[], time: number) {
    const milliseconds = time * 1000;
    const interval$ = interval(milliseconds);
    interval$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.schemasService
        .getObjectValue(uidList)
        .pipe(takeUntil(this.destroy$))
        .subscribe((response) => {
          if (response.error) {
            // const message = getErrorsMessage(response.error) || 'Ошибка получения информации';
            // this.notificationsService.displayMessage('Ошибка', message, 'error');
            return;
          }
          response.result.data.forEach((item) => {
            const element = this.graph
              .getCells()
              .find((cell) => cell.attributes.attrs?.['rdf']?.['syncUid'] === item.uid);
            if (!element) {
              return;
            }
            const wraptext = util.breakText(item.msg, {
              width: 160,
            });
            element.attr('label/text', wraptext);
          });
        });
    });
  }
  private addGluePoints(gluePoints: Array<Array<dia.Cell>>) {
    gluePoints.forEach((cells: Array<dia.Cell>) => {
      cells.forEach((cell, i) => {
        if (i === 0) {
          return;
        }
        if (!cell.attributes['attrs']?.['rdf']?.['unlinked']) {
          return;
        }
        cell.set('position', { x: cells[0].position().x, y: cells[i].position().y });
      });
      const size =
        cells.find((cell) => cell.attributes['attrs']?.['rdf']?.['type'] === 'DiagramObject')?.attributes['size']?.[
          'width'
        ] ?? 1;
      const groupElement = new shapes.standard.Rectangle({
        size: {
          width: size,
          height: size,
        },
        position: { x: cells[0].attributes['position'].x, y: cells[0].attributes['position'].y },
        z: 0,
        attrs: { body: { fill: 'transparent', stroke: 'transparent' } },
      });
      cells.forEach((cell) => {
        groupElement.embed(cell);
      });
      this.graph.addCells([groupElement]);
    });
  }
  private getCellsGroupArray(key: string, type: string | null = null) {
    const entities: Array<Array<dia.Cell>> = [];
    const usedEntities: string[] = [];
    this.graph.getCells().forEach((cell) => {
      if (type && cell.attributes.attrs?.['rdf']?.['type'] !== type) {
        return;
      }
      if (cell.attributes.attrs?.['rdf']?.[key] === undefined) {
        return;
      }
      const entity = cell.attributes.attrs?.['rdf']?.[key];
      if (!entity || usedEntities.includes(entity)) {
        return;
      }

      const data = this.graph.getCells().filter((item) => item.attributes.attrs?.['rdf']?.[key] === entity);
      entities.push(data);
      usedEntities.push(entity);
    });
    return entities;
  }
  private hasSameCoordsCell(cells: dia.Cell[], cellToCheck: dia.Cell) {
    return cells.some(
      (cell) =>
        cell.position().x === cellToCheck.position().x &&
        cell.position().y === cellToCheck.position().y &&
        cell.id !== cellToCheck.id,
    );
  }
  private addConnectionLines(cells: Array<dia.Cell>) {
    for (let i = 0; i < cells.length; i++) {
      if (i + 1 === cells.length) {
        return;
      }
      if (!this.hasSameCoordsCell(cells, cells[i + 1])) {
        if (cells[i].attributes.attrs?.['rdf']?.['unlinked']) {
          const parent1 = this.graph
            .getCells()
            .find(
              (cell) =>
                cell.attributes.attrs?.['rdf']?.['DiagramObjectGluePoint'] ===
                  cells[i].attributes.attrs?.['rdf']?.['DiagramObjectGluePoint'] &&
                cell.attributes.attrs?.['rdf']?.['type'] !== 'Terminal',
            );
          const parent2 = this.graph
            .getCells()
            .find(
              (cell) =>
                cell.attributes.attrs?.['rdf']?.['DiagramObjectGluePoint'] ===
                  cells[i + 1].attributes.attrs?.['rdf']?.['DiagramObjectGluePoint'] &&
                cell.attributes.attrs?.['rdf']?.['type'] !== 'Terminal',
            );

          if (parent1) {
            cells[i].set('position', { x: parent1.position().x, y: parent1.position().y });
            cells[i + 1].set('position', { x: parent1.position().x, y: parent1.position().y + 20 });
          }
          if (parent2) {
            cells[i + 1].set('position', { x: parent2.position().x, y: parent2.position().y });
            if (cells[i].position().x === 0) {
              cells[i].set('position', { x: parent2.position().x, y: parent2.position().y - 20 });
            }
          }
        }
        cells = cells.sort(
          (a, b) =>
            Number(a.attributes.attrs?.['rdf']?.['sequenceNumber'] || 0) -
            Number(b.attributes.attrs?.['rdf']?.['sequenceNumber'] || 0),
        );
        const link = new shapes.standard.Link({
          source: { id: cells[i].id, anchor: { name: 'center' } },
          target: { id: cells[i + 1].id, anchor: { name: 'center' } },
          z: 1,
          attrs: {
            line: {
              stroke: 'blue',
              strokeWidth: 3,
              sourceMarker: {
                type: 'none',
              },
              targetMarker: {
                type: 'none',
              },
            },
          },
        });
        // link.router('manhattan', {
        //   elementPadding: 5,
        //   perpendicular: true,
        // });
        // link.connector('jumpover', { size: 10 });
        this.graph.addCell(link);
      }
    }
  }
  private clearSelectedGroup() {
    this.selectedGroup.forEach((el: any) => {
      this.selectedGroupElement?.unembed(el);
      el.findView(this.paper).unhighlight();
    });
    this.selectedGroup = [];
    this.selectedGroupElement?.remove();
    this.selectedGroupElement = null;
  }
  private setSelectedGroup(x: number = 0, y: number = 0) {
    if (this.selectedGroupElement) {
      return;
    }
    this.selectedGroupElement = new shapes.standard.Rectangle({
      position: { x, y },
      z: 0,
      attrs: { body: { fill: 'transparent', 'stroke-dasharray': 2 } },
    });
    this.selectedGroupElement.addTo(this.graph);
  }
  private undo() {
    this.changeQueue.undoEvent();
  }
  private copyGroup() {
    if (!this.selectedGroupElement) {
      return;
    }
    const clone = this.graph.cloneSubgraph(this.selectedGroup);
    const copy = Object.keys(clone || {}).map((key) => clone?.[key]);
    copy.forEach((el) => {
      const pos = el?.prop('position');
      if (pos) {
        pos.x += 5;
        pos.y += 5;
        el?.prop('position', pos);
      }
    });
    this.clipboard.copy(JSON.stringify(copy));
    this.notificationsService.displayMessage('Успешно', 'Скопировано в буфер обмена.', 'success', 3000);
  }
  private pasteGroup() {
    navigator['clipboard'].readText().then((data) => {
      if (!data) {
        return;
      }
      const buff = JSON.parse(data) as dia.Element[];
      if (this.selectedGroupElement) {
        this.clearSelectedGroup();
      }
      const graph = new dia.Graph({}, { cellNamespace: shapes });
      const cells = graph.cloneCells(graph.fromJSON({ cells: buff }).getCells());
      this.setSelectedGroup();

      Object.keys(cells).forEach((key) => {
        const cpy = cells[key];
        cpy.addTo(this.graph);
        if (!cpy.isLink()) {
          this.selectedGroup.push(cpy);
          this.selectedGroupElement?.embed(cpy);
          cpy.findView(this.paper).highlight();
        }
      });
      this.selectedGroupElement?.fitEmbeds({ deep: true, padding: 30 });
    });
  }
  private deleteGroup() {
    this.selectedGroupElement?.remove();
    this.selectedGroup = [];
  }
  private initWrapperEvents() {
    if (!this.wrapper) {
      return;
    }
    document.addEventListener('mouseup', () => {
      this.isMoving = false;
    });
    this.wrapper.nativeElement.addEventListener('mouseover', () => {
      if (!this.wrapper) {
        return;
      }
      this.wrapper.nativeElement.focus();
    });
    this.wrapper.nativeElement.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.ctrlKey || !this.wrapper || this.isCellTarget) {
        return;
      }
      this.isMoving = true;
      this.scrollLeft = this.wrapper.nativeElement.scrollLeft;
      this.scrollTop = this.wrapper.nativeElement.scrollTop;
      this.xPosition = event.x;
      this.yPosition = event.y;
    });
    this.wrapper.nativeElement.addEventListener('mouseup', (event: MouseEvent) => {
      if (event.ctrlKey || !this.wrapper) {
        return;
      }
      this.isMoving = false;
    });
    this.wrapper.nativeElement.addEventListener('mousemove', (event: MouseEvent) => {
      if (!this.wrapper || !this.isMoving) {
        return;
      }
      this.wrapper.nativeElement.scrollLeft = this.scrollLeft + this.xPosition - event.clientX;
      this.wrapper.nativeElement.scrollTop = this.scrollTop + this.yPosition - event.clientY;
    });

    this.wrapper.nativeElement.addEventListener('keyup', (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === 'KeyC') {
        this.copyGroup();
      }
      if (event.ctrlKey && event.code === 'KeyZ') {
        this.undo();
      }
      if (event.ctrlKey && event.code === 'KeyV') {
        this.pasteGroup();
      }
      if (event.code === 'Delete') {
        this.deleteGroup();
      }
    });
  }
  private initGraphEvents() {
    this.graph.on('add', (event, change, opt) => {
      this.changeQueue.pushEvent({ type: 'add', event: { event: event, change: change, opt: opt } });
    });

    this.graph.on('remove', (event, change, opt) => {
      if (this.removeAll) {
        return;
      }
      this.selectedGroup = this.selectedGroup?.filter((el: any) => el.id !== event.id);
      if (this.selectedGroup?.length) {
        this.selectedGroupElement?.fitEmbeds({ deep: true, padding: 30 });
      } else if (this.selectedGroupElement) {
        this.graph.removeCells([this.selectedGroupElement]);
      }
      this.changeQueue.pushEvent({ type: 'remove', event: { event: event, change: change, opt: opt } });
    });
    this.graph.on('change:position', (element, newPosition, opt) => {
      this.elChangePos.next(element);
      if (this.selectedGroup?.length) {
        this.selectedGroupElement?.fitEmbeds({ deep: true, padding: 30 });
      }
    });
  }
  private initPaperEvents() {
    this.paper.freeze();
    this.paper.setInteractivity({ stopDelegation: false });
    this.paper.on({
      'blank:pointerdown': (evt, x, y) => {
        if (evt.ctrlKey) {
          this.clearSelectedGroup();
          this.setSelectedGroup(x, y);
          evt.data = { selecting: true, x: x, y: y };
        }
      },
      'blank:pointermove': (evt, x, y) => {
        if (evt.data.selecting && !evt.ctrlKey) {
          this.clearSelectedGroup();
        } else if (evt.data.selecting) {
          const deltaX = x - evt.data.x;
          const deltaY = y - evt.data.y;
          this.selectedGroupElement?.prop('position', {
            x: deltaX > 0 ? evt.data.x : x,
            y: deltaY > 0 ? evt.data.y : y,
          });
          this.selectedGroupElement?.prop('size', { width: Math.abs(deltaX), height: Math.abs(deltaY) });
        }
      },
      'blank:pointerup': (evt) => {
        if (!evt.data.selecting || !evt.ctrlKey || !this.selectedGroupElement) {
          return;
        }
        this.selectedGroup = this.graph.findModelsUnderElement(this.selectedGroupElement) || [];
        if (!this.selectedGroup?.length) {
          this.clearSelectedGroup();
          return;
        }
        this.selectedGroup.forEach((el: dia.Cell) => {
          // if (el.getParentCell()) {
          //   const parent = el.getParentCell();
          //   parent?.unembed(el);
          //   parent?.set('postion', { x: evt.clientX, y: evt.clientY });
          //   this.selectedGroupElement?.embed(el);
          // }
          this.selectedGroupElement?.embed(el);
          el.findView(this.paper).highlight();
        });
        this.selectedGroupElement.fitEmbeds({ deep: true, padding: 30 });
      },
    });

    this.paper.on('blank:pointerclick', (event, x, y) => {
      this.addElement(x, y);
    });
    this.paper.on('cell:pointerclick', (cellView, evt) => {
      if (evt.ctrlKey) {
        const elementView = cellView.model;
        if (!this.graphSelectedElement) {
          this.graphSelectedElement = elementView;
        } else {
          this.addConnectionLine(this.graphSelectedElement, elementView);
          this.graphSelectedElement = null;
        }
        return;
      }
      if (!cellView) {
        return;
      }
      const ref = this.dialogService.open(ElementDataDialogComponent, {
        width: '480px',
        title: 'Атрибуты элемента',
        data: cellView.model,
      });
      ref.afterClosed().subscribe((data) => {
        if (!data) {
          return;
        }
        if (cellView.model.attributes.attrs?.['rdf']?.['type'] === 'TextDiagramObject') {
          cellView.model.attr('label/text', data);
          return;
        }
        const textObject = this.graph
          .getCells()
          .find(
            (cell) =>
              cell.attributes.attrs?.['rdf']?.['parentObjectId'] ===
                cellView.model.attributes.attrs?.['rdf']?.['parentObjectId'] && cellView.model.cid !== cell.cid,
          );
        if (textObject) {
          textObject.attr('label/text', data);
        }
      });
    });
    this.paper.on('cell:pointerdown', () => {
      this.isCellTarget = true;
    });
    this.paper.on('cell:pointerup', () => {
      this.isCellTarget = false;
    });
    this.paper.on('scale', (sx: number, sy: number) => {
      if (!this.wrapper) {
        return;
      }
      const element = this.wrapper.nativeElement;
      const width = element.offsetWidth / sx;
      const height = element.offsetHeight / sy;
      const x = element.scrollLeft / sx;
      const y = element.scrollTop / sy;
      const elementData = { x, y, width, height };
      const elements = this.graph
        .findModelsInArea(elementData)
        .filter((el) => el.attributes['attrs']?.['rdf']?.['type'] === 'DiagramObject');
    });

    this.paper.on('element:pointerdown', () => {
      this.elChangePos.pipe(take(1), takeUntil(this.destroy$)).subscribe((event) => {
        if (this.selectedGroup.length) {
          const events = [];
          for (const element of this.selectedGroup) {
            if (!element) {
              return;
            }
            events.push({ element, initial: { position: element.prop('position') } });
          }
          events.push({
            element: this.selectedGroupElement,
            initial: {
              position: this.selectedGroupElement?.prop('position'),
              size: this.selectedGroupElement?.prop('size'),
            },
          });
          this.changeQueue.pushEvent({ type: 'groupPosition', event: events });
        } else {
          if (!event) {
            return;
          }
          this.changeQueue.pushEvent({
            type: 'position',
            event: { event, initial: { position: event.prop('position') } },
          });
        }
      });
    });

    this.paper.unfreeze();
  }
  ngOnChanges() {
    if (typeof Worker !== 'undefined') {
      this.loading = true;
      convertJsonLdWorker.postMessage(this.schemaData);
    }
  }
  ngAfterViewInit() {
    if (!this.canvas) {
      return;
    }
    this.loadGraph();
    this.initWrapperEvents();
    this.initPaperEvents();
    this.initGraphEvents();
    convertJsonLdWorker.onmessage = ({ data }) => {
      this.currentJsonData = data;
      this.loadSchemaFromJson();
      this.loading = false;
    };
    convertJsonLdWorker.onerror = () => {
      this.loading = false;
      this.notificationsService.displayMessage('Ошибка зыгрузки схемы', 'Ошибка загрузки', 'error');
    };
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
