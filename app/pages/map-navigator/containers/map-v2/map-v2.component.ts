import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import L from 'leaflet';
import DraggableLines from 'leaflet-draggable-lines';
import {
  CustomMarker,
  CustomMarkerOptions,
  Line,
  LineData,
  LineOptions,
  MapAction,
  MapMode,
  MarkerData,
  grndTowerIcon,
  substationIcon,
  towerIcon,
} from './models';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { ApiResolverComponent, DeleteConfirmDialogTemplateComponent, SearchFieldComponent } from '@shared/components';
import { MapService } from '../../services/map.service';
import { ReplaySubject, filter, finalize, forkJoin, takeUntil } from 'rxjs';
import * as geojson from 'geojson';
import { uid } from '@core/utils/uid';
import { PassportsTreeService } from '@features/passports-tree/services/passports-tree.service';
import { AppConfigService, NotificationsService, QueryParamsService } from '@services';
import { MapSidePanelComponent } from '../map-side-panel/map-side-panel.component';
import { GeoJsonClass } from '@api-calls/services/http-graph-service/models';
import { ApiService } from '@api-calls/api/api.service';
import { CLASSES_WITH_SCHEMA } from '@core/consts/classes-with-schema';
import { CLASSES_WITH_PASSPORT } from '@core/consts/classes-with-passport';
import { MapEditActionComponent } from './components/map-action-modal/map-edit-action.component';
import { DialogService } from '@shared/services';
import { AddElementDataModalComponent } from './components/add-element-data-modal/add-element-data-modal.component';
import { PointTypeModalComponent } from './components/point-type-modal/point-type-modal.component';
import { materialModules } from '@shared/materials';
import { GenerateGeoDataDiffService, GeoPoint, LineSpan } from '../../services/generate-geo-data-diff.service';
import { LineSpanActionModalComponent } from './components/line-span-action-modal/line-span-action-modal.component';
import { COORDS_ROUNDING_VALUE } from './const/coords-rounding-value';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import 'leaflet.vectorgrid';
import { MatOptionSelectionChange } from '@angular/material/core';
import { TileLayerName } from './pipes/tile-layer-name.pipe';
import { getCroppedName } from '@core/utils/cut-prefix';
export type TileLayer = 'tower' | 'substation' | 'linespan';
let activeTooltips: { tooltip: L.Tooltip; layer: any }[] = [];
export interface LayerConfig {
  name: string;
  layer: L.TileLayer;
  isActive: boolean;
}

interface CustomPathOptions extends L.PathOptions {
  icon?: L.Icon;
}
interface CustomProtobufOptions extends L.VectorGrid.ProtobufOptions {
  vectorTileLayerStyles: Record<string, CustomPathOptions>;
}
L.Canvas.Tile.include({
  _onClick: function (e: MouseEvent) {
    if (e.type === 'contextmenu') {
      e.preventDefault();
    }
    const point = this._map.mouseEventToLayerPoint(e).subtract(this.getOffset());
    let layer;
    let clickedLayer;
    for (const id in this._layers) {
      layer = this._layers[id];
      if (layer.options.interactive && layer._containsPoint(point)) {
        clickedLayer = layer;
      }
    }
    if (clickedLayer) {
      clickedLayer.fire(e.type, e, true);
    }
    // this._map?.fireEvent(e.type, e, true);
  },
  _onMouseMove: function (e: MouseEvent) {
    const point = this._map.mouseEventToLayerPoint(e).subtract(this.getOffset());
    let layer;
    let hoveredLayer = null;
    for (const id in this._layers) {
      layer = this._layers[id];
      if (layer.options.interactive && layer._containsPoint(point) && !layer.options.tooltip) {
        hoveredLayer = layer;
      } else if (activeTooltips.length) {
        activeTooltips.forEach((el) => {
          el.tooltip.close();
          el.tooltip.removeFrom(this.map);
          el.layer.options.tooltip = null;
        });
        activeTooltips = [];
      }
    }
    if (hoveredLayer) {
      hoveredLayer.fireEvent('mouseover', e, true);
      hoveredLayer = null;
    }

    // if (mouseOutLayers.length) {
    //   mouseOutLayers.forEach((layer) => {
    //     layer.fireEvent('mouseout', undefined, true);
    //   });
    //   mouseOutLayers = [];
    // }

    this._map?.fireEvent(e.type, e, true);
  },
});
@Component({
  selector: 'app-map-v2',
  imports: [
    CommonModule,
    LeafletModule,
    RouterModule,
    MapSidePanelComponent,
    MapEditActionComponent,
    ApiResolverComponent,
    SearchFieldComponent,
    TileLayerName,
    materialModules.matSelectModule,
    materialModules.matButtonModule,
  ],
  templateUrl: './map-v2.component.html',
  styleUrl: './map-v2.component.scss',
})
export class MapV2Component {
  errorCode: number | null = null;
  errorMessage: string | null = null;
  loading: boolean = false;
  classList: GeoJsonClass[] = ['ACLineSegment'];
  mode: MapMode = 'view';
  currentLatLng: L.LatLng = new L.LatLng(0, 0);
  COORDS_ROUNDING_VALUE = COORDS_ROUNDING_VALUE;
  layers: LayerConfig[] = [
    {
      name: 'OpenStreetMap',
      layer: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }),
      isActive: true,
    },
    {
      name: 'Спутниковая',
      layer: L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: '0123',
        maxZoom: 22,
      }),
      isActive: false,
    },
  ];
  tileLayers: TileLayer[] = ['substation', 'linespan', 'tower'];
  activeTileLayers: TileLayer[] = ['substation'];
  options: L.MapOptions = {
    layers: this.layers.filter((layer) => layer.isActive).map((item) => item.layer),
  };
  searchValue: string = '';
  private isMarkersDraggable: boolean = false;
  private currentLineSpanChildren: GeoPoint[] = [];
  private lineSpanList: LineSpan[] = [];
  private action: MapAction = 'Substation';
  private joinPoints: GeoPoint[] = [];
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private map: L.Map | null = null;
  private regionNode: L.CircleMarker = new L.CircleMarker([52.1, 23.7], {
    radius: 80,
    color: 'var(--light-blue-bg)',
    fillOpacity: 0.7,
  });
  private layer: L.VectorGrid.Protobuf | null = null;
  private markersLayer: L.LayerGroup<CustomMarker> = L.markerClusterGroup();
  private lineSpansLayer: L.LayerGroup = L.layerGroup();
  private editElementsLayer: L.LayerGroup = L.layerGroup();
  private draggable: DraggableLines | null = null;
  private lineRenderer: L.Canvas = new L.Canvas({ padding: 0.5, tolerance: 10 });
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private mapService: MapService,
    private passportsTreeService: PassportsTreeService,
    private queryParamsService: QueryParamsService,
    private ngZone: NgZone,
    private apiService: ApiService,
    private dialogService: DialogService,
    private generateGeoDataDiffService: GenerateGeoDataDiffService,
    private appConfigService: AppConfigService,
    private cd: ChangeDetectorRef,
    private notificationsService: NotificationsService,
  ) {}
  get treeExpanding() {
    return this.passportsTreeService.treeExpanding;
  }
  get activeLayer() {
    return this.layers.find((layer) => layer.isActive);
  }

  searchOnMap() {
    if (!this.map) {
      return;
    }
    const formattedValue = this.searchValue.trim().toLowerCase();
    this.setViewToFeatureByName(formattedValue);
  }
  onMapReady($event: L.Map) {
    this.map = $event;
    this.map.attributionControl.setPrefix(false);
    const brest = new L.LatLng(52.14, 23.7);
    this.currentLatLng = brest;
    this.map.setView(brest, 10);
    this.map.on('zoomend', (event: L.LeafletEvent) => this.mapZoomLogic());
    this.map.on('click', (event: L.LeafletMouseEvent) => this.addElement(event));
    this.map.on('mousemove', (event: any) => {
      let latlng = null;
      if (event.hasOwnProperty('latlng')) {
        latlng = event.latlng;
      } else {
        latlng = this.map?.mouseEventToLatLng(event);
      }

      if (latlng) {
        this.currentLatLng = latlng;
        this.cd.detectChanges();
      }
    });
    // this.map.on('contextmenu', (event: any) => {
    //   console.log(event);
    //   event.preventDefault();
    // });
    // this.draggable = new DraggableLines(this.map);
    // this.draggable?.disable();
    // this.draggable.on('dragend', (event: L.LeafletEvent) => this.ngZone.run(() => this.lineDrag(event)));
    this.changeLayersDisplay([this.markersLayer, this.lineSpansLayer], true);
    this.loadQueryParams();
    this.treeNavigationEvents();
    this.addGridLayer();
    if (this.route.snapshot.queryParams['uid']) {
      this.setViewToFeature(this.route.snapshot.queryParams['uid']);
    }
    // this.getGeoJson();
    // this.getGeoJsonV2();
  }
  changeAction(action: MapAction) {
    this.action = action;
    if (this.action === 'drag') {
      this.toggleDraggableState(true);
      // this.draggable?.enable();
    } else {
      this.toggleDraggableState(false);
      // this.draggable?.disable();
    }
  }
  changeActiveTileLayers(event: MatOptionSelectionChange) {
    if (!event.isUserInput) {
      return;
    }

    if (!this.activeTileLayers.includes(event.source.value)) {
      this.activeTileLayers.push(event.source.value);
    } else {
      this.activeTileLayers = this.activeTileLayers.filter((item) => item !== event.source.value);
    }
    this.addGridLayer();
  }
  getGeoJsonV2() {
    this.errorCode = null;
    this.errorMessage = null;
    this.loading = true;
    forkJoin([
      this.mapService.getGeoJsonV2('Substation'),
      this.mapService.getGeoJsonV2('LineSpan'),
      this.mapService.getGeoJsonV2('Tower'),
    ])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((responses) => {
        let geojson: geojson.Feature[] = [];
        responses.forEach((response) => {
          if (response.error) {
            return;
          }

          geojson = geojson.concat(response.result.data['features']);
        });
        L.geoJSON(geojson, {
          onEachFeature: (feature, layer) => this.onEachFeature(feature, layer),
        });
        this.selectACLine();
        this.mapZoomLogic();
      });
  }
  getGeoJson() {
    this.loading = true;
    const reqs = [
      this.apiService.getFromMinio<any>('test-bucket', 'substation.geojson'),
      this.apiService.getFromMinio<any>('test-bucket', 'tower.geojson'),
      this.apiService.getFromMinio<any>('test-bucket', 'linespan.geojson'),
    ];
    forkJoin(reqs)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe((responses) => {
        let geojson: geojson.Feature[] = [];
        responses.forEach((response) => {
          if (response.error) {
            return;
          }
          const data = JSON.parse(response.result);
          geojson = geojson.concat(data['features']);
        });
        L.geoJSON(geojson, {
          onEachFeature: (feature, layer) => this.onEachFeature(feature, layer),
        });
        this.selectACLine();
        // const length = geojson.length;
        // if (length) {
        //   this.regionNode.bindTooltip(length.toString(), {
        //     permanent: true,
        //     direction: 'center',
        //     className: 'text',
        //   });
        //   this.regionNode.addOneTimeEventListener('add', () => {
        //     setTimeout(() => {
        //       this.regionNode.getTooltip()?.update();
        //     });
        //   });
        // }
        this.mapZoomLogic();
      });
  }
  changeMode(mode: MapMode) {
    this.mode = mode;
    if (!this.map) {
      return;
    }
    if (this.mode === 'view') {
      this.action = 'Substation';
      this.toggleDraggableState(false);
      this.draggable?.disable();
      this.editElementsLayer.removeFrom(this.map);
      return;
    }

    if (!this.map.hasLayer(this.editElementsLayer)) {
      this.editElementsLayer.addTo(this.map);
    }
  }
  panelStateChanged() {
    this.router.navigate(['./'], {
      relativeTo: this.route,
      queryParams: { uid: this.route.snapshot.queryParams['uid'], panelState: this.mapService.panelState },
    });
  }
  changeMapLayer(layerConfig: LayerConfig) {
    if (!this.map || !this.activeLayer) {
      return;
    }
    this.map.removeLayer(this.activeLayer.layer);
    this.activeLayer.isActive = false;
    this.map.addLayer(layerConfig.layer);
    layerConfig.isActive = true;
    this.addGridLayer();
    this.mapZoomLogic();
  }
  private addGridLayer() {
    if (!this.map) {
      return;
    }
    const vectorTileOptions: CustomProtobufOptions = {
      rendererFactory: L.canvas.tile,
      interactive: true,
      vectorTileLayerStyles: {
        substation: {
          icon: substationIcon,
        },
        tower: {
          icon: towerIcon,
        },
        linespan: {
          weight: 2,
          color: 'darkblue',
        },
      },

      getFeatureId(feature) {
        return feature.id || '';
      },
    };
    if (this.layer) {
      this.layer.removeFrom(this.map);
    }
    this.layer = L.vectorGrid.protobuf(
      this.appConfigService.config['TILE_SERVER_URL'] + `/${this.activeTileLayers.join(',')}/{z}/{x}/{y}`,
      vectorTileOptions,
    );

    this.layer.on('mouseover', (e: any) => {
      if (!this.map) {
        return;
      }
      const tooltip = L.tooltip({
        permanent: false,
        direction: 'right',
      });
      const latlng = this.map?.mouseEventToLatLng(e);
      const name = e.layer.properties['name'] || 'Геосущность';
      //       if(e.layer.properties['type']==='LineSpan') {
      // name = e.layer.properties['parentAcLineName'];
      //       }
      tooltip.setLatLng(latlng);
      tooltip.setContent(name);
      tooltip.addTo(this.map);
      e.layer.options.tooltip = tooltip;
      activeTooltips.push({ tooltip: tooltip, layer: e.layer });
    });
    this.layer.on('contextmenu', (e: any) => {
      this.clickMenuHandler(e);
    });
    this.mapZoomLogic();
    if (this.map.getZoom() > 9) {
      this.mapZoomLogic();
    }
  }
  private clickMenuHandler(e: any) {
    if (!this.map) {
      return;
    }

    this.map.closePopup();
    const container = document.createElement('div');
    container.className = 'actions-popup';
    if (!e.layer.properties?.['uid']) {
      return;
    }
    const showEditButton =
      e.layer.properties?.['type'] === 'LineSpan' ? this.classList.includes('ACLineSegment') : true;
    if (showEditButton) {
      const showInEditor = document.createElement('div');
      showInEditor.className = 'popup-content';
      const linkToEditor = document.createElement('p');
      showInEditor.id = 'toEditor';
      linkToEditor.className = 'popup-text';
      linkToEditor.textContent = 'Открыть в редакторе';
      const editorIcon = document.createElement('mat-icon');
      editorIcon.textContent = 'edit';
      editorIcon.className = 'material-symbols-outlined';
      showInEditor.appendChild(editorIcon);
      showInEditor.appendChild(linkToEditor);
      container.appendChild(showInEditor);
      //----------------------------------------------------
    }

    const showTreeItem = document.createElement('div');
    showTreeItem.className = 'popup-content';
    const linkToTree = document.createElement('p');
    showTreeItem.id = 'toTree';
    linkToTree.className = 'popup-text';
    linkToTree.textContent = 'Показать в дереве';
    const treeIcon = document.createElement('mat-icon');
    treeIcon.textContent = 'folder';
    treeIcon.className = 'material-symbols-outlined';
    showTreeItem.appendChild(treeIcon);
    showTreeItem.appendChild(linkToTree);
    container.appendChild(showTreeItem);
    //----------------------------------------------------

    if (CLASSES_WITH_PASSPORT.includes(e.layer.properties?.['type'])) {
      const schemaBlock = document.createElement('div');
      schemaBlock.className = 'popup-content';
      const linkToSchema = document.createElement('p');
      schemaBlock.id = 'toSchema';
      linkToSchema.className = 'popup-text';
      linkToSchema.textContent = 'Собрать схему';
      const schemaIcon = document.createElement('mat-icon');
      schemaIcon.textContent = 'schema';
      schemaIcon.className = 'material-symbols-outlined';
      schemaBlock.appendChild(schemaIcon);
      schemaBlock.appendChild(linkToSchema);
      container.appendChild(schemaBlock);
    }
    //----------------------------------------------------
    if (CLASSES_WITH_SCHEMA.includes(e.layer.properties?.['type'])) {
      const passportBlock = document.createElement('div');
      passportBlock.className = 'popup-content';
      const linkToPassport = document.createElement('p');
      passportBlock.id = 'toPassport';
      linkToPassport.className = 'popup-text';
      linkToPassport.textContent = 'Показать паспорт';
      const passportIcon = document.createElement('mat-icon');
      passportIcon.textContent = 'description';
      passportIcon.className = 'material-symbols-outlined';
      passportBlock.appendChild(passportIcon);
      passportBlock.appendChild(linkToPassport);
      container.appendChild(passportBlock);

      //----------------------------------------------------
      const pngBlock = document.createElement('div');
      pngBlock.className = 'popup-content';
      const openPng = document.createElement('p');
      pngBlock.id = 'openPng';
      openPng.className = 'popup-text';
      openPng.textContent = 'Показать схему в png';
      const pngIcon = document.createElement('mat-icon');
      pngIcon.textContent = 'perm_media';
      pngIcon.className = 'material-symbols-outlined';
      pngBlock.appendChild(pngIcon);
      pngBlock.appendChild(openPng);
      container.appendChild(pngBlock);
    }

    const latlng = this.map?.mouseEventToLatLng(e);
    const popup = L.popup().setLatLng(latlng).setContent(container.outerHTML).openOn(this.map);
    let uid = e.layer.properties?.['uid'];
    if (e.layer.properties?.['type'] === 'LineSpan' && this.classList.includes('ACLineSegment')) {
      uid = e.layer.properties?.['aclinesegment'];
    }
    this.ngZone.run(() => {
      popup
        .getElement()
        ?.querySelector('#toEditor')
        ?.addEventListener('click', () => {
          this.openInNewTab(['/navigator', uid]);
          this.mapService.panelState = null;
        });
      popup
        .getElement()
        ?.querySelector('#toTree')
        ?.addEventListener('click', () => {
          this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: { uid: uid, panelState: null },
          });
          this.mapService.panelState = null;
        });
      popup
        .getElement()
        ?.querySelector('#toSchema')
        ?.addEventListener('click', () => {
          this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: { uid: uid, panelState: 'schema' },
          });
          this.mapService.panelStateData = {
            name: e.layer.properties?.['name'] || '',
            type: e.layer.properties?.['type'] || '',
          };
          this.mapService.panelState = 'schema';
        });
      popup
        .getElement()
        ?.querySelector('#toPassport')
        ?.addEventListener('click', () => {
          this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: { uid: uid, panelState: 'passport' },
          });
          this.mapService.panelStateData = {
            name: e.layer.properties?.['name'] || '',
            type: e.layer.properties?.['type'] || '',
          };
          this.mapService.panelState = 'passport';
        });
      popup
        .getElement()
        ?.querySelector('#openPng')
        ?.addEventListener('click', () => {
          this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: { uid: uid, panelState: 'schema_png' },
          });
          this.mapService.panelStateData = {
            name: e.layer.properties?.['name'] || '',
            type: e.layer.properties?.['type'] || '',
          };
          this.mapService.panelState = 'schema_png';
        });
    });
  }
  private openInNewTab(path: string[], query: Params = {}) {
    const url = this.router.serializeUrl(this.router.createUrlTree(path, { queryParams: query }));
    window.open(url, '_blank');
  }
  private toggleDraggableState(draggable: boolean) {
    if (draggable) {
      this.editElementsLayer.getLayers().forEach((layer) => {
        (layer as CustomMarker).dragging?.enable();
      });
      this.isMarkersDraggable = true;
    } else {
      this.editElementsLayer.getLayers().forEach((layer) => {
        (layer as CustomMarker).dragging?.disable();
      });
      this.isMarkersDraggable = false;
    }
  }
  private addPoint(type: 'grndTower' | 'Tower' | 'Substation', coords: L.LatLng) {
    return new Promise<CustomMarker>((resolve) => {
      switch (type) {
        case 'grndTower': {
          const dialogRef = this.dialogService.open<AddElementDataModalComponent>(AddElementDataModalComponent, {
            title: 'Заполнить данные точки поворота кабеля',
            width: '480px',
            data: {
              latlng: coords,
            },
          });

          dialogRef
            .afterClosed()
            .pipe(filter((res) => !!res))
            .subscribe((res) => {
              const id = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
              const latlng = new L.LatLng(res.lat, res.lng);
              const data: MarkerData = {
                position: latlng,
                options: {
                  title: res.name,
                  icon: grndTowerIcon,
                  draggable: false,
                  uid: id,
                  bounds: latlng,
                },
                props: {
                  uid: id,
                  type: 'grndTower',
                },
              };
              const marker = this.generateMarker(data);
              marker.bindTooltip(data.options?.title || 'Подстанция', {
                permanent: false,
                direction: 'right',
              });
              marker.addTo(this.editElementsLayer);
              resolve(marker);
            });
          break;
        }
        case 'Tower': {
          const dialogRef = this.dialogService.open<AddElementDataModalComponent>(AddElementDataModalComponent, {
            title: 'Заполнить данные воздушной опоры',
            width: '480px',
            data: {
              latlng: coords,
            },
          });

          dialogRef
            .afterClosed()
            .pipe(filter((res) => !!res))
            .subscribe((res) => {
              const id = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
              const latlng = new L.LatLng(res.lat, res.lng);
              const data: MarkerData = {
                position: latlng,
                options: {
                  icon: towerIcon,
                  title: res.name,
                  draggable: false,
                  uid: id,
                  bounds: latlng,
                },
                props: {
                  uid: id,
                  type: 'Tower',
                },
              };
              const marker = this.generateMarker(data);
              marker.bindTooltip(data.options?.title || 'Подстанция', {
                permanent: false,
                direction: 'right',
              });
              marker.addTo(this.editElementsLayer);
              resolve(marker);
            });

          break;
        }
        case 'Substation': {
          const dialogRef = this.dialogService.open<AddElementDataModalComponent>(AddElementDataModalComponent, {
            title: 'Заполнить данные подстанции',
            width: '480px',
            data: {
              latlng: coords,
            },
          });

          dialogRef
            .afterClosed()
            .pipe(filter((res) => !!res))
            .subscribe((res) => {
              const id = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();

              const latlng = new L.LatLng(res.lat, res.lng);

              const data: MarkerData = {
                position: latlng,
                options: {
                  icon: substationIcon,
                  title: res.name,
                  draggable: false,
                  uid: id,
                  bounds: latlng,
                },
                props: {
                  uid: id,
                  type: 'Substation',
                },
              };
              const marker = this.generateMarker(data);
              marker.bindTooltip(data.options?.title || 'Подстанция', {
                permanent: false,
                direction: 'right',
              });
              marker.addTo(this.editElementsLayer);
              resolve(marker);
            });

          break;
        }
      }
    });
  }
  private addElement(event: L.LeafletMouseEvent) {
    this.ngZone.run(() => {
      if (this.mode === 'view') {
        return;
      }
      switch (this.action) {
        case 'grndTower': {
          const dialogRef = this.dialogService.open<AddElementDataModalComponent>(AddElementDataModalComponent, {
            title: 'Заполнить данные точки поворота кабеля',
            width: '480px',
            data: {
              latlng: event.latlng,
            },
          });

          dialogRef
            .afterClosed()
            .pipe(filter((res) => !!res))
            .subscribe((res) => {
              const id = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
              const latlng = new L.LatLng(res.lat, res.lng);
              const data: MarkerData = {
                position: latlng,
                options: {
                  title: res.name,
                  icon: grndTowerIcon,
                  draggable: false,
                  uid: id,
                  bounds: latlng,
                },
                props: {
                  uid: id,
                  type: 'grndTower',
                },
              };
              const marker = this.generateMarker(data);
              marker.bindTooltip(data.options?.title || 'Подстанция', {
                permanent: false,
                direction: 'right',
              });
              marker.addTo(this.editElementsLayer);
              const pointData: GeoPoint = {
                uid: marker.props?.['uid'] || '',
                name: marker.options.title || 'Точка',
                type: marker.props?.['type'],
                latLang: marker.getLatLng(),
                isNew: true,
              };
              this.generateGeoDataDiffService.loadPointDiff(pointData);
            });

          break;
        }
        case 'Tower': {
          const dialogRef = this.dialogService.open<AddElementDataModalComponent>(AddElementDataModalComponent, {
            title: 'Заполнить данные воздушной опоры',
            width: '480px',
            data: {
              latlng: event.latlng,
            },
          });

          dialogRef
            .afterClosed()
            .pipe(filter((res) => !!res))
            .subscribe((res) => {
              const id = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
              const latlng = new L.LatLng(res.lat, res.lng);
              const data: MarkerData = {
                position: latlng,
                options: {
                  icon: towerIcon,
                  title: res.name,
                  draggable: false,
                  uid: id,
                  bounds: latlng,
                },
                props: {
                  uid: id,
                  type: 'Tower',
                },
              };
              const marker = this.generateMarker(data);
              marker.bindTooltip(data.options?.title || 'Подстанция', {
                permanent: false,
                direction: 'right',
              });
              marker.addTo(this.editElementsLayer);
              const pointData: GeoPoint = {
                uid: marker.props?.['uid'] || '',
                name: marker.options.title || 'Точка',
                type: marker.props?.['type'],
                latLang: marker.getLatLng(),
                isNew: true,
              };
              this.generateGeoDataDiffService.loadPointDiff(pointData);
            });

          break;
        }
        case 'Substation': {
          const dialogRef = this.dialogService.open<AddElementDataModalComponent>(AddElementDataModalComponent, {
            title: 'Заполнить данные подстанции',
            width: '480px',
            data: {
              latlng: event.latlng,
            },
          });

          dialogRef
            .afterClosed()
            .pipe(filter((res) => !!res))
            .subscribe((res) => {
              const id = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
              const latlng = new L.LatLng(res.lat, res.lng);
              const data: MarkerData = {
                position: latlng,
                options: {
                  icon: substationIcon,
                  title: res.name,
                  draggable: false,
                  uid: id,
                  bounds: latlng,
                },
                props: {
                  uid: id,
                  type: 'Substation',
                },
              };
              const marker = this.generateMarker(data);
              marker.bindTooltip(data.options?.title || 'Подстанция', {
                permanent: false,
                direction: 'right',
              });
              marker.addTo(this.editElementsLayer);
              const pointData: GeoPoint = {
                uid: marker.props?.['uid'] || '',
                name: marker.options.title || 'Точка',
                type: marker.props?.['type'],
                latLang: marker.getLatLng(),
                isNew: true,
              };
              this.generateGeoDataDiffService.loadPointDiff(pointData);
            });
          break;
        }
        case 'LineSpan': {
          if (!event.originalEvent.ctrlKey && !this.currentLineSpanChildren.length) {
            return;
          }
          if (event.originalEvent.ctrlKey) {
            const dialogRef = this.dialogService.open<PointTypeModalComponent>(PointTypeModalComponent, {
              title: 'Выбрать тип точки',
              width: '480px',
            });
            dialogRef
              .afterClosed()
              .pipe(filter((type) => !!type))
              .subscribe((type) => {
                this.addPoint(type, event.latlng).then((marker) => {
                  this.currentLineSpanChildren.push({
                    uid: marker.props?.['uid'] || '',
                    name: marker.options.title || 'Точка',
                    type: marker.props?.['type'],
                    latLang: marker.getLatLng(),
                    isNew: true,
                  });
                  if (this.currentLineSpanChildren.length > 1) {
                    const lineSpanName =
                      this.currentLineSpanChildren[this.currentLineSpanChildren.length - 2].name +
                      ' - ' +
                      this.currentLineSpanChildren[this.currentLineSpanChildren.length - 1].name;
                    const dialogRef = this.dialogService.open<AddElementDataModalComponent>(
                      AddElementDataModalComponent,
                      {
                        title: 'Заполнить данные пролета',
                        width: '480px',
                        data: {
                          action: 'LineSpan',
                          name: lineSpanName,
                        },
                      },
                    );
                    dialogRef
                      .afterClosed()
                      .pipe(filter((name) => !!name))
                      .subscribe((name) => {
                        const position = [
                          this.currentLineSpanChildren[this.currentLineSpanChildren.length - 2].latLang,
                          this.currentLineSpanChildren[this.currentLineSpanChildren.length - 1].latLang,
                        ];

                        const id = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
                        const data: LineData = {
                          position: [position],
                          options: {
                            color: 'darkblue',
                            weight: 2,
                            title: name,
                            uid: id,
                            bounds: event.latlng,
                            renderer: this.lineRenderer,
                          },
                          props: {
                            uid: id,
                            type: 'LineSpan',
                          },
                        };
                        const line = this.generateLine(data);
                        line.options.bounds = line.getBounds().getCenter();
                        line.bindTooltip(data.options?.title || 'Пролет', {
                          permanent: false,
                          direction: 'right',
                        });
                        line.addTo(this.editElementsLayer);
                        const pointsUidList: string[] = [
                          this.currentLineSpanChildren[this.currentLineSpanChildren.length - 2].uid,
                          this.currentLineSpanChildren[this.currentLineSpanChildren.length - 1].uid,
                        ];
                        this.lineSpanList.push({
                          uid: line.props?.['uid'] || '',
                          name: line.options.title || '',
                          type: line.props?.['type'] || '',
                          pointsUidList: pointsUidList,
                        });
                        this.draggable?.disable();
                      });
                  }
                });
              });

            return;
          }
          this.generateGeoDataDiffService
            .loadACLineDiff({
              pointsList: this.currentLineSpanChildren,
              lineSpansList: this.lineSpanList,
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
              if (!res) {
                this.currentLineSpanChildren = [];
                this.lineSpanList = [];
                return;
              }
              const acLineId = res;

              this.fillMarkersWithACLineUid(acLineId, this.currentLineSpanChildren);
              this.currentLineSpanChildren = [];
              this.lineSpanList = [];
            });
          break;
        }
        case 'ACLineSegment': {
          break;
        }
      }
    });
  }
  private selectACLine() {
    const uid = this.passportsTreeService.selectedUID;
    if (!uid || !this.map) {
      return;
    }
    const acLinesLayer = this.lineSpansLayer
      .getLayers()
      .find((layer) => (layer.options as LineOptions)?.['parentACLine'] === uid);
    if (!acLinesLayer) {
      return;
    }
    const bounds = (acLinesLayer.options as LineOptions)['bounds'];
    this.lineSpansLayer
      .getLayers()
      .filter((layer) => (layer.options as LineOptions)?.['parentACLine'] === uid)
      .forEach((layer) => (layer as Line).setStyle({ color: 'orange' }));
    this.map.setView(bounds, 13);
  }
  private mapZoomLogic() {
    if (!this.map) {
      return;
    }
    const zoom = this.map.getZoom();
    this.iconSizeLogic();
    if (zoom <= 9) {
      const value = zoom * 20;
      const radius = value < 40 ? 40 : value;
      this.regionNode.setRadius(radius);
      this.regionNode.bindTooltip('Брест', {
        permanent: true,
        direction: 'center',
        className: 'text',
      });
      this.regionNode.addTo(this.map);
      this.classList = [];
      this.layer?.removeFrom(this.map);
      activeTooltips.forEach((item) => {
        item.tooltip.remove();
      });
      activeTooltips = [];
      // this.changeLayersDisplay([this.markersLayer, this.lineSpansLayer], false);
      return;
    }
    this.regionNode.removeFrom(this.map);
    this.layer?.addTo(this.map);
    // if (zoom <= 10 && this.map.hasLayer(this.lineSpansLayer)) {
    //   this.lineSpansLayer.removeFrom(this.map);
    // }
    // if (zoom > 10 && !this.map.hasLayer(this.lineSpansLayer)) {
    //   this.lineSpansLayer.addTo(this.map);
    // }
    if (zoom > 12 && zoom <= 15 && !this.classList.includes('ACLineSegment')) {
      this.classList = ['ACLineSegment'];
      return;
    }
    if (zoom > 15 && zoom <= 18 && !this.classList.includes('Sections')) {
      this.classList = ['Sections'];
      return;
    }
    if (zoom > 18 && !this.classList.includes('LineSpan')) {
      this.classList = ['LineSpan'];
    }
  }
  private iconSizeLogic() {
    if (!this.map) {
      return;
    }
    const zoom = this.map.getZoom();
    if (zoom < 11) {
      towerIcon.options.iconSize = [12, 12];
      return;
    }
    if (zoom > 11 && zoom <= 13) {
      towerIcon.options.iconSize = [20, 20];
      this.classList = ['ACLineSegment'];
      return;
    }
    if (zoom > 13 && zoom <= 15) {
      towerIcon.options.iconSize = [25, 25];
      this.classList = ['Sections'];
      return;
    }
    if (zoom > 15) {
      towerIcon.options.iconSize = [30, 30];
      this.classList = ['LineSpan'];
    }
  }
  private changeLayersDisplay(layers: L.LayerGroup[], add: boolean) {
    if (add) {
      layers.forEach((layer) => {
        if (!this.map) {
          return;
        }
        layer.addTo(this.map);
      });
      return;
    }
    layers.forEach((layer) => {
      if (!this.map) {
        return;
      }
      layer.removeFrom(this.map);
    });
  }
  private clearLayers(layers: L.LayerGroup[]) {
    layers.forEach((layer) => {
      layer.clearLayers();
    });
  }
  private loadQueryParams() {
    this.queryParamsService
      .getParams(['uid', 'className', 'panelState'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.passportsTreeService.selectedUID = params['uid'];
        const className = params['className'];
        if (!className) {
          return;
        }
        let layerType: any = getCroppedName(className).toLowerCase();
        if (layerType === 'aclinesegment') {
          layerType = 'linespan';
        }
        if (!this.tileLayers.includes(layerType)) {
          return;
        }
        if (this.activeTileLayers.includes(layerType)) {
          return;
        }
        this.activeTileLayers.push(layerType);

        this.addGridLayer();
      });
  }
  private setViewToFeature(uid: string) {
    if (!this.map) {
      return;
    }
    this.mapService
      .getCoordsByUid(uid)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.error) {
          const message = getErrorsMessage(res.error) || 'Ошибка получения геоданных';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
        } else {
          const latLng = {
            lat: Number(res.result.latitude),
            lng: Number(res.result.longitude),
          };
          this.map?.setView(latLng, 18);
        }
      });
  }
  private setViewToFeatureByName(name: string) {
    if (!this.map) {
      return;
    }
    this.mapService
      .getCoordsByName(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.error) {
          const message = getErrorsMessage(res.error) || 'Ошибка получения геоданных';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
        } else {
          const latLng = {
            lat: Number(res.result.latitude),
            lng: Number(res.result.longitude),
          };
          this.map?.setView(latLng, 18);
        }
      });
  }
  private treeNavigationEvents() {
    this.passportsTreeService.navigateToNode$.pipe(takeUntil(this.destroy$)).subscribe((uid) => {
      if (!uid) {
        return;
      }
      this.setViewToFeature(uid);
      const panelState = null;

      this.router.navigate(['./'], {
        relativeTo: this.route,
        queryParams: { uid, panelState: panelState },
      });

      // const markerLayer = this.markersLayer
      //   .getLayers()
      //   .find((layer) => (layer.options as CustomMarkerOptions)?.['uid'] === uid);

      // if (markerLayer) {
      //   const bounds = (markerLayer.options as CustomMarkerOptions)['bounds'];
      //   this.map.setView({ lat: bounds.lat, lng: bounds.lng + 0.0025 }, 18);
      //   this.mapService.panelStateData = {
      //     name: (markerLayer as CustomMarker).props?.['name'] || '',
      //     type: (markerLayer as CustomMarker).props?.['type'] || '',
      //   };
      //   (markerLayer as CustomMarker).toggleTooltip();
      //   return;
      // }

      // const acLinesLayer = this.lineSpansLayer
      //   .getLayers()
      //   .find((layer) => (layer.options as LineOptions)?.['parentACLine'] === uid);
      // if (acLinesLayer) {
      //   const bounds = (acLinesLayer.options as LineOptions)['bounds'];
      //   this.lineSpansLayer.getLayers().forEach((layer) => (layer as Line).setStyle({ color: 'darkblue' }));
      //   this.map.setView(bounds, 13);
      //   this.lineSpansLayer
      //     .getLayers()
      //     .filter((layer) => (layer.options as LineOptions)?.['parentACLine'] === uid)
      //     .forEach((layer) => (layer as Line).setStyle({ color: 'orange' }));
      //   return;
      // }

      // const lineSpansLayer = this.lineSpansLayer
      //   .getLayers()
      //   .find((layer) => (layer.options as LineOptions)?.['uid'] === uid);
      // if (lineSpansLayer) {
      //   this.lineSpansLayer.getLayers().forEach((layer) => (layer as Line).setStyle({ color: 'darkblue' }));
      //   const bounds = (lineSpansLayer.options as LineOptions)['bounds'];
      //   this.map.setView(bounds, 18);
      //   (lineSpansLayer as Line).setStyle({ color: 'orange' });
      //   this.mapService.panelStateData = {
      //     name: (lineSpansLayer as Line).props?.['name'] || '',
      //     type: (lineSpansLayer as Line).props?.['type'] || '',
      //   };
      //   return;
      // }
    });
  }
  private onEachFeature(feature: geojson.Feature, layer: L.Layer) {
    if (!this.map) {
      return;
    }
    switch (feature.geometry.type) {
      case 'Point': {
        const type = feature.properties?.['type'];
        if (!type) {
          return;
        }
        switch (type) {
          case 'Substation': {
            const bounds = new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
            const data: MarkerData = {
              position: bounds,
              options: {
                icon: substationIcon,
                title: feature.properties?.['name'] || 'Тестовая подстанция',
                draggable: false,
                uid: feature.properties?.['uid'],
                bounds,
              },
              props: feature.properties,
            };
            const marker = this.generateMarker(data);
            marker.bindTooltip(data.options?.title || 'Тестовая подстанция', {
              permanent: false,
              direction: 'right',
            });
            marker.addTo(this.markersLayer);
            const uid = this.route.snapshot.queryParams['uid'];
            if (uid && marker.props?.['uid'] === uid) {
              this.map.setView(marker.getLatLng(), 18);
              marker.toggleTooltip();
              return;
            }
            break;
          }
          case 'Tower': {
            const bounds = new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
            const data: MarkerData = {
              position: bounds,
              options: {
                icon: towerIcon,
                title: feature.properties?.['name'] || 'Опора',
                draggable: false,
                parentLineSpan: feature.properties?.['LineSpan'],
                parentACLineSegment: feature.properties?.['ACLineSegment'],
                uid: feature.properties?.['uid'],
                bounds,
              },
              props: feature.properties,
            };
            const marker = this.generateMarker(data);
            marker.bindTooltip(data.options?.title || 'Опора', {
              permanent: false,
              direction: 'right',
            });
            marker.addTo(this.markersLayer);
            const uid = this.route.snapshot.queryParams['uid'];
            if (uid && marker.props?.['uid'] === uid) {
              this.map.setView(marker.getLatLng(), 18);
              marker.toggleTooltip();
              return;
            }
            break;
          }
        }
        break;
      }
      case 'MultiLineString': {
        const type = feature.properties?.['type'];
        if (!type) {
          return;
        }
        switch (type) {
          case 'LineSpan': {
            const latlngList: L.LatLngExpression[][] = feature.geometry.coordinates.map((position) => {
              const latlang: L.LatLngExpression[] = [];
              position.forEach((coord) => {
                latlang.push(new L.LatLng(coord[1], coord[0]));
              });
              return latlang;
            });
            const data: LineData = {
              position: latlngList,
              options: {
                color: 'darkblue',
                weight: 2,
                uid: feature.properties?.['uid'],
                title: feature.properties?.['name'] || 'Пролет',
                parentACLine: feature.properties?.['ACLineSegment'],
                parentSection: feature.properties?.['Sections'],
                bounds: new L.LatLng(25, 25),
                renderer: this.lineRenderer,
              },
              props: feature.properties,
            };

            const line = this.generateLine(data);
            line.bindTooltip(data.options?.title || 'Пролет', {
              permanent: false,
              direction: 'right',
            });
            line.addTo(this.lineSpansLayer);
            line.options.bounds = line.getBounds().getCenter();
            const uid = this.route.snapshot.queryParams['uid'];
            if (uid && line.props?.['uid'] === uid) {
              this.map.setView(line.getBounds().getCenter(), 18);
              line.setStyle({ color: 'orange' });
              return;
            }
            break;
          }
        }
        break;
      }
    }
  }
  private generateMarker(data: MarkerData) {
    const type = data.props?.['type'];
    if (type === 'Tower' || type === 'grndTower') {
      return new CustomMarker(data.position, data.options, data.props ?? undefined)
        .on('mouseover', (event: L.LeafletMouseEvent) => {
          const marker = event.target as CustomMarker;
          if (this.isMarkersDraggable) {
            marker.dragging?.enable();
          } else {
            marker.dragging?.disable();
          }
          const parentUid = marker.options?.['parentLineSpan'];
          if (Array.isArray(parentUid)) {
            const lineSpansLayer = this.lineSpansLayer
              .getLayers()
              .filter((layer) => parentUid.includes((layer.options as LineOptions)?.['uid'] || ''));
            lineSpansLayer.forEach((layer) => (layer as Line).setStyle({ color: 'orange' }));
          }
        })
        .on('mouseout', (event: L.LeafletMouseEvent) => {
          const marker = event.target as CustomMarker;
          const parentUid = marker.options?.['parentLineSpan'];
          if (Array.isArray(parentUid)) {
            const lineSpansLayer = this.lineSpansLayer
              .getLayers()
              .filter((layer) => parentUid.includes((layer.options as LineOptions)?.['uid'] || ''));

            lineSpansLayer.forEach((layer) => (layer as Line).setStyle({ color: 'darkblue' }));
          }
        })
        .on('click', (event: L.LeafletMouseEvent) => this.ngZone.run(() => this.markerClick(event)))
        .on('dragend', (event: L.LeafletEvent) => this.ngZone.run(() => this.markerDrag(event)))
        .on('contextmenu', (event: L.LeafletMouseEvent) => this.contextMenu(event));
    } else {
      return new CustomMarker(data.position, data.options, data.props ?? undefined)
        .on('click', (event: L.LeafletMouseEvent) => this.ngZone.run(() => this.markerClick(event)))
        .on('dragend', (event: L.LeafletEvent) => this.ngZone.run(() => this.markerDrag(event)))
        .on('contextmenu', (event: L.LeafletMouseEvent) => this.contextMenu(event));
    }
  }
  private generateLine(data: LineData): Line {
    return new Line(data.position, data.options, data.props ?? undefined)
      .on('mouseover', (event: L.LeafletMouseEvent) => {
        const parentUid = (event.target as Line).options?.['parentACLine'];
        if (this.classList.includes('ACLineSegment')) {
          event.target.setStyle({ color: 'darkblue' });
          const lineSpansLayer = this.lineSpansLayer
            .getLayers()
            .filter((layer) => parentUid === (layer.options as LineOptions)?.['parentACLine']);
          lineSpansLayer.forEach((layer) => (layer as Line).setStyle({ color: 'orange' }));
        } else {
          const lineSpansLayer = this.lineSpansLayer
            .getLayers()
            .filter((layer) => parentUid === (layer.options as LineOptions)?.['parentACLine']);
          lineSpansLayer.forEach((layer) => (layer as Line).setStyle({ color: 'darkblue' }));
          event.target.setStyle({ color: 'orange' });
        }
      })
      .on('mouseout', (event: L.LeafletMouseEvent) => {
        const parentUid = (event.target as Line).options?.['parentACLine'];
        const lineSpansLayer = this.lineSpansLayer
          .getLayers()
          .filter((layer) => parentUid === (layer.options as LineOptions)?.['parentACLine']);
        lineSpansLayer.forEach((layer) => (layer as Line).setStyle({ color: 'darkblue' }));
      })
      .on('click', (event: L.LeafletMouseEvent) => this.ngZone.run(() => this.lineClick(event)))
      .on('contextmenu', (event: L.LeafletMouseEvent) => this.contextMenu(event));
  }
  private lineDrag(event: any) {
    const startCoords = event.from;
    const endCoords = event.to;
    const lineMarker = this.editElementsLayer
      .getLayers()
      .filter((el) => (el as CustomMarker | Line).props?.['type'] !== 'LineSpan')
      .find((layer) => {
        const marker = <CustomMarker>layer;
        return JSON.stringify(marker.getLatLng()) === JSON.stringify(startCoords);
      });
    if (!lineMarker) {
      return;
    }
    const foundedMarker = <CustomMarker>lineMarker;
    const startLatLng = foundedMarker.getLatLng();
    foundedMarker.setLatLng(endCoords);
    foundedMarker.options.bounds = endCoords;
    this.markerDrag(foundedMarker, startLatLng);
  }
  private markerDrag(event: L.LeafletEvent | CustomMarker, startLatLng: L.LatLng | null = null) {
    let marker: CustomMarker | null = null;
    if (event instanceof CustomMarker) {
      marker = event;
    } else {
      marker = <CustomMarker>event.target;
    }
    const currentLatLng = startLatLng ? startLatLng : marker.options.bounds;
    marker.options.bounds = marker.getLatLng();

    [...this.editElementsLayer.getLayers(), ...this.lineSpansLayer.getLayers()]
      .filter((el) => (el as CustomMarker | Line).props?.['type'] === 'LineSpan')
      .filter((layer) => {
        const el = <Line>layer;
        const lineCoords = el.getLatLngs() as L.LatLng[][];
        const coords = lineCoords[0].find((coords) => JSON.stringify(coords) === JSON.stringify(currentLatLng));
        return !!coords;
      })
      .forEach((line) => {
        const el = <Line>line;
        const lineCoords = el.getLatLngs() as L.LatLng[][];
        const coords = lineCoords[0].find((coords) => JSON.stringify(coords) === JSON.stringify(currentLatLng));
        if (!coords || !marker) {
          return;
        }
        const indexOfCoords = lineCoords[0].indexOf(coords);
        lineCoords[0][indexOfCoords] = marker.getLatLng();
        el.setLatLngs(lineCoords);
      });

    const pointData: GeoPoint = {
      uid: marker.props?.['uid'] || '',
      name: marker.options.title || 'Точка',
      type: marker.props?.['type'],
      latLang: marker.getLatLng(),
      isNew: false,
    };
    this.generateGeoDataDiffService.loadRelocatePontDiff(pointData);
  }
  private lineClick(event: L.LeafletMouseEvent) {
    if (this.action === 'delete') {
      const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
        DeleteConfirmDialogTemplateComponent,
        {
          title: 'Удалить элемент',
          data: 'Вы уверены хотите удалить элемент?',
        },
      );
      dialogRef
        .afterClosed()
        .pipe(filter(Boolean))
        .subscribe(() => {
          event.target.removeFrom(this.editElementsLayer);
        });
      return;
    }
  }
  private markerClick(event: L.LeafletMouseEvent) {
    if (this.action === 'delete') {
      const dialogRef = this.dialogService.open<DeleteConfirmDialogTemplateComponent>(
        DeleteConfirmDialogTemplateComponent,
        {
          title: 'Удалить элемент',
          data: 'Вы уверены хотите удалить элемент?',
        },
      );
      dialogRef
        .afterClosed()
        .pipe(filter(Boolean))
        .subscribe(() => {
          event.target.removeFrom(this.editElementsLayer);
        });
      return;
    }
    if (this.mode === 'view' || !event.originalEvent.ctrlKey) {
      return;
    }
    if (JSON.stringify(this.joinPoints[0]) === JSON.stringify(event.latlng)) {
      return;
    }
    const marker = <CustomMarker>event.target;
    const markerData: GeoPoint = {
      name: marker.options.title || '',
      uid: marker.props?.['uid'],
      type: marker.props?.['type'],
      latLang: marker.getLatLng(),
      parentACLineSegment: marker.props?.['parentACLineSegment'],
      isNew: false,
    };
    this.joinPoints.push(markerData);
    if (this.joinPoints.length === 2) {
      const lineSpanName = this.joinPoints[0].name + ' - ' + this.joinPoints[1].name;
      const dialogRef = this.dialogService.open<AddElementDataModalComponent>(AddElementDataModalComponent, {
        title: 'Заполнить данные пролета',
        width: '480px',
        data: { action: 'LineSpan', name: lineSpanName },
      });
      const coords = [this.joinPoints.map((point) => point.latLang)];
      dialogRef.afterClosed().subscribe((name) => {
        if (!name) {
          this.joinPoints = [];
          return;
        }
        const id = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
        const data: LineData = {
          position: coords,
          options: {
            color: 'darkblue',
            weight: 2,
            title: name,
            uid: id,
            bounds: event.latlng,
            renderer: this.lineRenderer,
          },
          props: {
            uid: id,
            type: 'LineSpan',
          },
        };
        const line = this.generateLine(data);
        line.options.bounds = line.getBounds().getCenter();
        line.bindTooltip(data.options?.title || 'Пролет', {
          permanent: false,
          direction: 'right',
        });
        const lineSpanData: LineSpan = {
          uid: line.props?.['uid'],
          name: line.options.title || '',
          type: line.props?.['type'],
          pointsUidList: this.joinPoints.map((point) => point.uid),
        };
        const pointsInAcLine = this.joinPoints.filter((point) => point.parentACLineSegment);
        if (pointsInAcLine.length) {
          const dialogRef = this.dialogService.open<LineSpanActionModalComponent>(LineSpanActionModalComponent, {
            title: 'Выберите действие',
            width: '480px',
          });

          dialogRef
            .afterClosed()
            .pipe(filter((res) => !!res))
            .subscribe((res) => {
              if (!res) {
                this.joinPoints = [];
                return;
              }
              line.addTo(this.editElementsLayer);
              this.generateGeoDataDiffService
                .loadLineSpanDiff(this.joinPoints, lineSpanData, pointsInAcLine[0].parentACLineSegment || null)
                .pipe(takeUntil(this.destroy$))
                .subscribe((res) => {
                  if (!res) {
                    this.joinPoints = [];
                    return;
                  }
                  const acLineId = res;
                  this.fillMarkersWithACLineUid(acLineId, this.joinPoints);
                  this.joinPoints = [];
                });
            });
        } else {
          line.addTo(this.editElementsLayer);
          this.generateGeoDataDiffService
            .loadACLineDiff({
              pointsList: this.joinPoints,
              lineSpansList: [lineSpanData],
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
              if (!res) {
                this.joinPoints = [];
                return;
              }
              const acLineId = res;
              this.fillMarkersWithACLineUid(acLineId, this.joinPoints);
              this.joinPoints = [];
            });
        }
      });
    }
  }
  private fillMarkersWithACLineUid(uid: string, markers: GeoPoint[]) {
    markers.forEach((data) => {
      const layer = this.editElementsLayer
        .getLayers()
        .find((layer) => (layer.options as CustomMarkerOptions)?.['uid'] === data.uid);
      const marker = <CustomMarker>layer;
      if (marker?.props) {
        marker.props['parentACLineSegment'] = uid;
      }
    });
  }
  private contextMenu(event: L.LeafletMouseEvent) {
    if (!this.map) {
      return;
    }
    this.map.closePopup();
    const container = document.createElement('div');
    container.className = 'actions-popup';
    if (!event.target.props?.['uid']) {
      return;
    }
    const showEditButton =
      event.target.props?.['type'] === 'LineSpan' ? this.classList.includes('ACLineSegment') : true;
    if (showEditButton) {
      const showInEditor = document.createElement('div');
      showInEditor.className = 'popup-content';
      const linkToEditor = document.createElement('p');
      showInEditor.id = 'toEditor';
      linkToEditor.className = 'popup-text';
      linkToEditor.textContent = 'Открыть в редакторе';
      const editorIcon = document.createElement('mat-icon');
      editorIcon.textContent = 'edit';
      editorIcon.className = 'material-symbols-outlined';
      showInEditor.appendChild(editorIcon);
      showInEditor.appendChild(linkToEditor);
      container.appendChild(showInEditor);
      //----------------------------------------------------
    }

    const showTreeItem = document.createElement('div');
    showTreeItem.className = 'popup-content';
    const linkToTree = document.createElement('p');
    showTreeItem.id = 'toTree';
    linkToTree.className = 'popup-text';
    linkToTree.textContent = 'Показать в дереве';
    const treeIcon = document.createElement('mat-icon');
    treeIcon.textContent = 'folder';
    treeIcon.className = 'material-symbols-outlined';
    showTreeItem.appendChild(treeIcon);
    showTreeItem.appendChild(linkToTree);
    container.appendChild(showTreeItem);
    //----------------------------------------------------

    if (CLASSES_WITH_PASSPORT.includes(event.target.props?.['type'])) {
      const schemaBlock = document.createElement('div');
      schemaBlock.className = 'popup-content';
      const linkToSchema = document.createElement('p');
      schemaBlock.id = 'toSchema';
      linkToSchema.className = 'popup-text';
      linkToSchema.textContent = 'Собрать схему';
      const schemaIcon = document.createElement('mat-icon');
      schemaIcon.textContent = 'schema';
      schemaIcon.className = 'material-symbols-outlined';
      schemaBlock.appendChild(schemaIcon);
      schemaBlock.appendChild(linkToSchema);
      container.appendChild(schemaBlock);
    }
    //----------------------------------------------------
    if (CLASSES_WITH_SCHEMA.includes(event.target.props?.['type'])) {
      const passportBlock = document.createElement('div');
      passportBlock.className = 'popup-content';
      const linkToPassport = document.createElement('p');
      passportBlock.id = 'toPassport';
      linkToPassport.className = 'popup-text';
      linkToPassport.textContent = 'Показать паспорт';
      const passportIcon = document.createElement('mat-icon');
      passportIcon.textContent = 'description';
      passportIcon.className = 'material-symbols-outlined';
      passportBlock.appendChild(passportIcon);
      passportBlock.appendChild(linkToPassport);
      container.appendChild(passportBlock);

      //----------------------------------------------------
      const pngBlock = document.createElement('div');
      pngBlock.className = 'popup-content';
      const openPng = document.createElement('p');
      pngBlock.id = 'openPng';
      openPng.className = 'popup-text';
      openPng.textContent = 'Показать схему в png';
      const pngIcon = document.createElement('mat-icon');
      pngIcon.textContent = 'perm_media';
      pngIcon.className = 'material-symbols-outlined';
      pngBlock.appendChild(pngIcon);
      pngBlock.appendChild(openPng);
      container.appendChild(pngBlock);
    }

    const popup = L.popup().setLatLng(event.latlng).setContent(container.outerHTML).openOn(this.map);
    let uid = event.target.props?.['uid'];
    if (event.target.props?.['type'] === 'LineSpan' && this.classList.includes('ACLineSegment')) {
      uid = event.target.options?.['parentACLine'];
    }
    this.ngZone.run(() => {
      popup
        .getElement()
        ?.querySelector('#toEditor')
        ?.addEventListener('click', () => {
          this.openInNewTab(['/navigator', uid]);
          this.mapService.panelState = null;
        });
      popup
        .getElement()
        ?.querySelector('#toTree')
        ?.addEventListener('click', () => {
          this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: { uid: uid, panelState: null },
          });
          this.mapService.panelState = null;
        });
      popup
        .getElement()
        ?.querySelector('#toSchema')
        ?.addEventListener('click', () => {
          this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: { uid: uid, panelState: 'schema' },
          });
          this.mapService.panelStateData = {
            name: event.target.props?.['name'] || '',
            type: event.target.props?.['type'] || '',
          };
          this.mapService.panelState = 'schema';
        });
      popup
        .getElement()
        ?.querySelector('#toPassport')
        ?.addEventListener('click', () => {
          this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: { uid: uid, panelState: 'passport' },
          });
          this.mapService.panelStateData = {
            name: event.target.props?.['name'] || '',
            type: event.target.props?.['type'] || '',
          };
          this.mapService.panelState = 'passport';
        });
      popup
        .getElement()
        ?.querySelector('#openPng')
        ?.addEventListener('click', () => {
          this.router.navigate(['./'], {
            relativeTo: this.route,
            queryParams: { uid: uid, panelState: 'schema_png' },
          });
          this.mapService.panelStateData = {
            name: event.target.props?.['name'] || '',
            type: event.target.props?.['type'] || '',
          };
          this.mapService.panelState = 'schema_png';
        });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.map?.off();
    this.map = null;
  }
}
