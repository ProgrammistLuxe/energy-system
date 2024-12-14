import { ChangeDetectorRef, Component } from '@angular/core';
// import {
//   Graph,
//   G6Event,
//   G6GraphEvent,
//   GraphData,
//   NodeConfig,
//   EdgeConfig,
//   IG6GraphEvent,
//   INode,
//   IEdge,
//   Item,
//   Node,
// } from '@antv/g6';
import G6 from '@antv/g6';
import { ApiResolverComponent, WorkAreaComponent, WorkAreaSidePanelComponent } from '@shared/components';
import { GraphService } from './services/graph.service';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';
import {
  GetGraphSubstationsSchema,
  GraphNodeData,
  SubstationData,
} from '@api-calls/services/http-graph-service/models';
import { ActionPanelComponent } from './components/action-panel/action-panel.component';
import { DialogService } from '@shared/services';
import { AddNodeComponent } from './components/add-node/add-node.component';
import { EditNodeComponent } from './components/edit-node/edit-node.component';
import { CommonModule } from '@angular/common';
import { getRandomBetween } from '@core/utils/get-random-between';
import { Router } from '@angular/router';
import { uid } from '@core/utils/uid';
const CONTAINER_WIDTH = 15000;
const CONTAINER_HEIGHT = 15000;
export interface SelectedNode {
  id: string;
  name: string;
}
@Component({
  selector: 'app-graph',
  imports: [],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.scss',
})
export class GraphComponent {
  // loading: boolean = false;
  // errorCode: number | null = null;
  // errorMessage: string | null = null;
  // history: SelectedNode[] = [];
  // private currentEdge: SelectedNode | null = null;
  // private graph: Graph | null = null;
  // private addingEdge: boolean = false;
  // private edge: any = null;
  // private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  // private graphData: GraphData | null = null;
  // private added_count: number = 0;
  // constructor(
  //   private graphService: GraphService,
  //   private dialogService: DialogService,
  //   private cd: ChangeDetectorRef,
  //   private router: Router,
  // ) {}
  // getGraph() {
  //   this.loading = true;
  //   this.errorCode = null;
  //   this.errorMessage = null;
  //   this.graphService
  //     .getSubstationsSchema('Substation')
  //     .pipe(
  //       takeUntil(this.destroy$),
  //       finalize(() => (this.loading = false)),
  //     )
  //     .subscribe((res) => {
  //       if (res.error) {
  //         this.errorCode = +res;
  //         this.errorMessage = String(res);
  //         return;
  //       }
  //       if (!this.isItemInHistory('StartGraph')) {
  //         this.history.push({ name: 'Топология подстанций', id: 'StartGraph' });
  //       }
  //       setTimeout(() => {
  //         this.calculateGraphData(res.result);
  //       });
  //     });
  // }
  // changeMode(mode: string) {
  //   if (!this.graph) {
  //     return;
  //   }
  //   this.graph.setMode(mode);
  // }
  // getGraphNodeData() {
  //   if (!this.currentEdge) {
  //     return;
  //   }
  //   const id = this.currentEdge.id;
  //   if (!id.includes('#_')) {
  //     return;
  //   }
  //   this.loading = true;
  //   this.errorCode = null;
  //   this.errorMessage = null;
  //   this.graphService
  //     .getGraphNodeData(id)
  //     .pipe(
  //       takeUntil(this.destroy$),
  //       finalize(() => (this.loading = false)),
  //     )
  //     .subscribe((response) => {
  //       if (!this.currentEdge) {
  //         return;
  //       }
  //       if (response.error) {
  //         this.errorCode = +response;
  //         this.errorMessage = String(response);
  //         return;
  //       }
  //       if (!this.isItemInHistory(this.currentEdge.id)) {
  //         this.history.push(this.currentEdge);
  //       }
  //       this.calculateChildrenGraphData(response.result, this.currentEdge.name);
  //     });
  // }
  // reloadGraph() {
  //   if (!this.history.length || !this.currentEdge) {
  //     this.getGraph();
  //     return;
  //   }
  //   if (this.history.length === 1 && this.isItemInHistory('StartGraph')) {
  //     this.getGraph();
  //     return;
  //   }
  //   if (this.currentEdge.id === 'StartGraph') {
  //     this.getGraph();
  //     return;
  //   }
  //   this.getGraphNodeData();
  // }
  // deleteFromHistory(edge: SelectedNode) {
  //   this.history = this.history.filter((item) => item.id !== edge.id);
  // }
  // selectHistoryItem(edge: SelectedNode) {
  //   this.currentEdge = edge;
  //   if (edge.id === 'StartGraph') {
  //     this.getGraph();
  //   }
  //   this.getGraphNodeData();
  // }
  // private isItemInHistory(id: string): boolean {
  //   return this.history.map((item) => item.id).includes(id);
  // }
  // private registerGraphBehavior() {
  //   const graph = this.graph;
  //   const self = this;
  //   G6.registerBehavior('click-add-node', {
  //     // Set the events and the corresponding responsing function for this behavior
  //     getEvents() {
  //       // The event is canvas:click, the responsing function is onClick
  //       return {
  //         'canvas:click': 'onClick',
  //       };
  //     },
  //     // Click event
  //     onClick(ev: any) {
  //       const dialogRef = self.dialogService.open(AddNodeComponent, {
  //         width: '480px',
  //         title: 'Добавить подстанцию',
  //       });
  //       dialogRef.afterClosed().subscribe((data) => {
  //         if (!data) {
  //           return;
  //         }
  //         // Add a new node
  //         graph?.addItem('node', {
  //           x: ev.canvasX,
  //           y: ev.canvasY,
  //           label: data,
  //           id: `node-${self.added_count}`, // Generate the unique id
  //         });
  //         self.added_count++;
  //       });
  //     },
  //   });
  //   // Register a custom behavior: click two end nodes to add an edge
  //   G6.registerBehavior('click-add-edge', {
  //     // Set the events and the corresponding responsing function for this behavior
  //     getEvents() {
  //       return {
  //         'node:click': 'onClick', // The event is canvas:click, the responsing function is onClick
  //         mousemove: 'onMousemove', // The event is mousemove, the responsing function is onMousemove
  //         'edge:click': 'onEdgeClick', // The event is edge:click, the responsing function is onEdgeClick
  //       };
  //     },
  //     // The responsing function for node:click defined in getEvents
  //     onClick(ev: any) {
  //       const node = ev.item;
  //       // The position where the mouse clicks
  //       const point = { x: ev.x, y: ev.y };
  //       const model = node.getModel();
  //       if (self.addingEdge && self.edge) {
  //         graph?.updateItem(self.edge, {
  //           target: model.id,
  //         });
  //         self.edge = null;
  //         self.addingEdge = false;
  //       } else {
  //         // Add anew edge, the end node is the current node user clicks
  //         self.edge = graph?.addItem('edge', {
  //           type: 'circle-running',
  //           source: model.id,
  //           target: model.id,
  //         });
  //         self.addingEdge = true;
  //       }
  //     },
  //     // The responsing function for mousemove defined in getEvents
  //     onMousemove(ev: any) {
  //       // The current position the mouse clicks
  //       const point = { x: ev.x, y: ev.y };
  //       if (self.addingEdge && self.edge) {
  //         // Update the end node to the current node the mouse clicks
  //         graph?.updateItem(self.edge, {
  //           target: point,
  //         });
  //       }
  //     },
  //     // The responsing function for edge:click defined in getEvents
  //     onEdgeClick(ev: any) {
  //       const currentEdge = ev.item;
  //       if (self.addingEdge && self.edge === currentEdge) {
  //         graph?.removeItem(self.edge);
  //         self.edge = null;
  //         self.addingEdge = false;
  //       }
  //     },
  //   });
  // }
  // private registerAnimation2() {
  //   G6.registerEdge(
  //     'line-growth',
  //     {
  //       afterDraw(cfg, group) {
  //         const shape = group?.get('children')[0];
  //         const length = shape.getTotalLength();
  //         shape.animate(
  //           (ratio: any) => {
  //             const startLen = ratio * length;
  //             const cfg = {
  //               lineDash: [startLen, length - startLen],
  //             };
  //             return cfg;
  //           },
  //           {
  //             repeat: true, // Whether executes the animation repeatly
  //             duration: 2000, // the duration for executing once
  //           },
  //         );
  //       },
  //     },
  //     'cubic', // extend the built-in edge 'cubic'
  //   );
  //   G6.registerEdge(
  //     'custom-edge',
  //     {
  //       // Response the states change
  //       setState(name, value, item) {
  //         const group = item?.getContainer();
  //         const shape = group?.get('children')[0]; // The order is determined by the ordering of been draw
  //         if (name === 'active') {
  //           value ? shape.attr('stroke', 'purple') : shape.attr('stroke', 'lightblue');
  //         }
  //         if (name === 'selected') {
  //           value ? shape.attr('lineWidth', 2) : shape.attr('lineWidth', 1);
  //         }
  //       },
  //     },
  //     'line',
  //   );
  // }
  // private registerEdgeAnimation() {
  //   G6.registerEdge(
  //     'circle-running',
  //     {
  //       afterDraw(cfg, group) {
  //         // get the first shape in the group, it is the edge's path here=
  //         const shape = group?.get('children')[0];
  //         // the start position of the edge's path
  //         const startPoint = shape.getPoint(0);
  //         // add red circle shape
  //         const circle = group?.addShape('circle', {
  //           attrs: {
  //             width: 7,
  //             height: 7,
  //             x: startPoint.x,
  //             y: startPoint.y,
  //             fill: 'red',
  //             r: 3,
  //           },
  //           name: 'circle-shape',
  //         });
  //         circle?.animate(
  //           (ratio: any) => {
  //             const tmpPoint = shape.getPoint(ratio);
  //             return {
  //               x: tmpPoint.x,
  //               y: tmpPoint.y,
  //             };
  //           },
  //           {
  //             repeat: true,
  //             duration: 700,
  //           },
  //         );
  //       },
  //     },
  //     'cubic',
  //   );
  // }
  // private refreshDragedNodePosition(e: IG6GraphEvent) {
  //   if (!e.item) {
  //     return;
  //   }
  //   const model = e.item.get('model');
  //   model.fx = e.x;
  //   model.fy = e.y;
  // }
  // private initEvents() {
  //   if (!this.graph) {
  //     return;
  //   }
  //   this.graph.on('node:click', (ev) => {
  //     const edge = ev.item;
  //     if (!edge || this.graph?.getCurrentMode() === 'addEdge') {
  //       return;
  //     }
  //     this.currentEdge = { name: edge._cfg?.model?.label?.toString() || '', id: edge.getID() };
  //     this.getGraphNodeData();
  //     // const dialogRef = this.dialogService.open(EditNodeComponent, {
  //     //   width: '480px',
  //     //   title: 'Обновить подстанцию',
  //     //   data: edge._cfg?.model?.label ?? '',
  //     // });
  //     // dialogRef.afterClosed().subscribe((data) => {
  //     //   if (!data) {
  //     //     return;
  //     //   }
  //     //   this.graph?.update(edge.getID(), { label: data });
  //     // });
  //   });
  //   this.graph.on('node:dragstart', (e) => {
  //     this.graph?.layout();
  //     this.refreshDragedNodePosition(e);
  //   });
  //   this.graph.on('node:drag', (e) => {
  //     this.refreshDragedNodePosition(e);
  //   });
  //   this.graph.on('node:dragend', (e) => {
  //     if (!e.item) {
  //       return;
  //     }
  //     e.item.get('model').fx = null;
  //     e.item.get('model').fy = null;
  //   });
  //   this.graph.on('edge:click', (ev) => {
  //     const edge = ev.item;
  //     if (!edge) {
  //       return;
  //     }
  //     this.graph?.setItemState(edge, 'selected', !edge.hasState('selected'));
  //   });
  //   this.graph.on('edge:mouseenter', (ev) => {
  //     const edge = ev.item;
  //     if (!edge) {
  //       return;
  //     }
  //     this.graph?.setItemState(edge, 'active', true);
  //   });
  //   this.graph.on('edge:mouseleave', (ev) => {
  //     const edge = ev.item;
  //     if (!edge) {
  //       return;
  //     }
  //     this.graph?.setItemState(edge, 'active', false);
  //   });
  // }
  // private loadGraph() {
  //   if (this.graph) {
  //     this.graph.clear();
  //     this.graph.destroyLayout();
  //     this.graph.destroy();
  //   }
  //   this.graph = new Graph({
  //     container: 'container',
  //     layout: {
  //       type: 'fruchterman',
  //       center: [7500, 7500], // The center of the graph by default
  //       gravity: 20,
  //       speed: 2,
  //       clustering: true,
  //       clusterGravity: 30,
  //       maxIteration: 2000,
  //       workerEnabled: true, // Whether to activate web-worker
  //       gpuEnabled: true, // Whether to enable the GPU parallel computing, supported by G6 4.0
  //     },
  //     width: CONTAINER_WIDTH,
  //     height: CONTAINER_HEIGHT,
  //     modes: {
  //       // Defualt mode
  //       default: ['drag-node', 'click-select'],
  //       // Adding node mode
  //       addNode: ['click-add-node', 'click-select'],
  //       // Adding edge mode
  //       addEdge: ['click-add-edge', 'click-select'],
  //     },
  //     defaultNode: {
  //       size: 20,
  //       style: {
  //         fill: 'yellow',
  //         stroke: 'lightblue',
  //       },
  //       labelCfg: {
  //         position: 'left',
  //         offset: 10,
  //         style: {
  //           fill: 'orange',
  //         },
  //       },
  //     },
  //     defaultEdge: {
  //       // type: 'circle-running',
  //       // type: 'custom-edge',
  //       curve: false,
  //       style: {
  //         stroke: 'lightblue',
  //         lineWidth: 1,
  //       },
  //     },
  //   });
  //   if (this.graphData) {
  //     this.graph.data(this.graphData);
  //   }
  //   this.graph.render();
  // }
  // private fillNodeData(nodes: NodeConfig[], usedCoords: string[], node: SubstationData) {
  //   const x = getRandomBetween(100, 14900);
  //   const y = getRandomBetween(100, 14900);
  //   const coordsId = x + '' + y;
  //   if (!usedCoords.includes(coordsId)) {
  //     usedCoords.push(coordsId);
  //     nodes.push({
  //       id: node.uid,
  //       label: node.name,
  //       x,
  //       y,
  //     });
  //   } else {
  //     this.fillNodeData(nodes, usedCoords, node);
  //   }
  // }
  // private fillChildNodeData(nodeList: NodeConfig[], item: Record<string, any>, length: number) {
  //   const name = item?.['name'] ?? '';
  //   const x = getRandomBetween(250, 50 * length);
  //   const y = getRandomBetween(250, 50 * length);
  //   const type = item['class_name']?.split('#')[1] || '';
  //   const label = type + ' - ' + name;
  //   nodeList.push({
  //     id: item?.['value'] ?? uid(),
  //     label: label,
  //     x,
  //     y,
  //   });
  // }
  // private calculateChildrenGraphData(data: GraphNodeData, parentName: string) {
  //   const nodeList: NodeConfig[] = [];
  //   const parent: NodeConfig = {
  //     id: data.data.uid,
  //     label: parentName,
  //     x: 250,
  //     y: 250,
  //   };
  //   nodeList.push(parent);
  //   const properties = data.data.properties;
  //   let length = Object.keys(properties).length;
  //   Object.keys(properties).forEach((key) => {
  //     if (properties[key]?.length > 1) {
  //       const list: Record<string, any>[] = properties[key];
  //       list.forEach(() => {
  //         length++;
  //       });
  //     }
  //   });
  //   Object.keys(properties).forEach((key) => {
  //     if (properties[key]?.length === 1) {
  //       this.fillChildNodeData(nodeList, properties[key][0], length);
  //     }
  //     if (properties[key]?.length > 1) {
  //       const list: Record<string, any>[] = properties[key];
  //       list.forEach((item) => {
  //         this.fillChildNodeData(nodeList, item, length);
  //       });
  //     }
  //   });
  //   const edges: EdgeConfig[] = [];
  //   nodeList.forEach((node, i) => {
  //     if (i === 0) {
  //       return;
  //     }
  //     edges.push({
  //       source: parent.id,
  //       target: node.id,
  //     });
  //   });
  //   this.graphData = {
  //     nodes: nodeList,
  //     edges: edges,
  //   };
  //   if (this.graphData) {
  //     this.graph?.destroyLayout();
  //     this.graph?.changeData(this.graphData);
  //   }
  // }
  // private calculateGraphData(response: GetGraphSubstationsSchema) {
  //   const nodes: NodeConfig[] = [];
  //   const usedCoords: string[] = [];
  //   response.nodes.forEach((node) => {
  //     if (!nodes.map((node) => node.id).includes(node.uid)) {
  //       this.fillNodeData(nodes, usedCoords, node);
  //     }
  //   });
  //   const edges: EdgeConfig[] = [];
  //   const response_edges: string[][] = response.edges;
  //   response_edges.forEach((item) => {
  //     for (let i = 0; i < item.length; i++) {
  //       if (i + 1 === item.length) {
  //         return;
  //       }
  //       // edges.push({ source: item[i], target: item[i + 1], type: 'circle-running' });
  //       edges.push({ source: item[i], target: item[i + 1] });
  //     }
  //   });
  //   this.graphData = {
  //     nodes,
  //     edges,
  //   };
  //   this.loadGraph();
  //   this.initEvents();
  //   this.registerGraphBehavior();
  // }
  // ngAfterViewInit() {
  //   this.registerEdgeAnimation();
  //   this.registerAnimation2();
  //   this.cd.detectChanges();
  //   this.getGraph();
  // }
  // ngOnDestroy() {
  //   this.destroy$.next();
  //   this.destroy$.complete();
  // }
}
