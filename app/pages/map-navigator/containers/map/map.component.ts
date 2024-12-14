import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import * as Leaflet from 'leaflet';
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
import { AppConfigService, QueryParamsService } from '@services';
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
export interface LayerConfig {
  name: string;
  layer: Leaflet.TileLayer;
  isActive: boolean;
}
@Component({
  selector: 'app-map',
  imports: [
    CommonModule,
    LeafletModule,
    RouterModule,
    MapSidePanelComponent,
    MapEditActionComponent,
    ApiResolverComponent,
    SearchFieldComponent,
    materialModules.matSelectModule,
    materialModules.matButtonModule,
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent {
  errorCode: number | null = null;
  errorMessage: string | null = null;
  loading: boolean = false;
  classList: GeoJsonClass[] = ['ACLineSegment'];
  mode: MapMode = 'view';
  currentLatLng: Leaflet.LatLng = new Leaflet.LatLng(0, 0);
  COORDS_ROUNDING_VALUE = COORDS_ROUNDING_VALUE;
  tileLayers: LayerConfig[] = [
    {
      name: 'OpenStreetMap',
      layer: Leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }),
      isActive: true,
    },
    {
      name: 'Спутниковая',
      layer: Leaflet.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: 'Map data &copy;2024 Google',
        subdomains: '0123',
        maxZoom: 22,
      }),
      isActive: false,
    },
  ];
  options: Leaflet.MapOptions = {
    layers: this.tileLayers.filter((layer) => layer.isActive).map((item) => item.layer),
  };
  searchValue: string = '';
  private isMarkersDraggable: boolean = false;
  private currentLineSpanChildren: GeoPoint[] = [];
  private lineSpanList: LineSpan[] = [];
  private action: MapAction = 'Substation';
  private joinPoints: GeoPoint[] = [];
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  private map: Leaflet.Map | null = null;
  private regionNode: Leaflet.CircleMarker = new Leaflet.CircleMarker([52.1, 23.7], {
    radius: 80,
    color: 'var(--bg-gray)',
  });
  private markersLayer: Leaflet.LayerGroup<CustomMarker> = Leaflet.markerClusterGroup();
  private lineSpansLayer: Leaflet.LayerGroup = Leaflet.layerGroup();
  private editElementsLayer: Leaflet.LayerGroup = Leaflet.layerGroup();
  private draggable: DraggableLines | null = null;
  private lineRenderer: Leaflet.Canvas = new Leaflet.Canvas({ padding: 0.5, tolerance: 10 });
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
  ) {}
  get treeExpanding() {
    return this.passportsTreeService.treeExpanding;
  }
  get activeTileLayer() {
    return this.tileLayers.find((layer) => layer.isActive);
  }
  searchOnMap() {
    if (!this.map) {
      return;
    }
    const formattedValue = this.searchValue.trim().toLowerCase();
    const markerLayer = this.markersLayer
      .getLayers()
      .find((layer) => (layer.options as CustomMarkerOptions)?.['title']?.toLowerCase()?.includes(formattedValue));

    if (markerLayer) {
      const bounds = (markerLayer.options as CustomMarkerOptions)['bounds'];
      this.map.setView({ lat: bounds.lat, lng: bounds.lng + 0.0025 }, 18);
      (markerLayer as CustomMarker).toggleTooltip();
      return;
    }

    const acLinesLayer = this.lineSpansLayer
      .getLayers()
      .find((layer) => (layer.options as LineOptions)?.['title']?.toLowerCase()?.includes(formattedValue));
    if (acLinesLayer) {
      const bounds = (acLinesLayer.options as LineOptions)['bounds'];
      this.lineSpansLayer.getLayers().forEach((layer) => (layer as Line).setStyle({ color: 'darkblue' }));
      this.map.setView(bounds, 13);
      this.lineSpansLayer
        .getLayers()
        .filter((layer) => (layer.options as LineOptions)?.['title']?.toLowerCase()?.includes(formattedValue))
        .forEach((layer) => (layer as Line).setStyle({ color: 'orange' }).toggleTooltip());
      return;
    }

    const lineSpansLayer = this.lineSpansLayer
      .getLayers()
      .find((layer) => (layer.options as LineOptions)?.['title']?.toLowerCase()?.includes(formattedValue));
    if (lineSpansLayer) {
      this.lineSpansLayer.getLayers().forEach((layer) => (layer as Line).setStyle({ color: 'darkblue' }));
      const bounds = (lineSpansLayer.options as LineOptions)['bounds'];
      this.map.setView(bounds, 18);
      (lineSpansLayer as Line).setStyle({ color: 'orange' });
      (lineSpansLayer as Line).toggleTooltip();
      return;
    }
  }
  onMapReady($event: Leaflet.Map) {
    this.map = $event;
    this.map.attributionControl.setPrefix(false);
    const brest = new Leaflet.LatLng(52.14, 23.7);
    this.currentLatLng = brest;
    this.map.setView(brest, 8);
    this.map.on('zoomend', (event: Leaflet.LeafletEvent) => this.mapZoomLogic());
    this.map.on('click', (event: Leaflet.LeafletMouseEvent) => this.addElement(event));
    this.map.on('mousemove', (event: Leaflet.LeafletMouseEvent) => {
      this.currentLatLng = event.latlng;
      this.cd.detectChanges();
    });
    this.map.on('contextmenu', (event: Leaflet.LeafletMouseEvent) => {
      event.originalEvent.preventDefault();
    });
    // this.draggable = new DraggableLines(this.map);
    // this.draggable?.disable();
    // this.draggable.on('dragend', (event: Leaflet.LeafletEvent) => this.ngZone.run(() => this.lineDrag(event)));
    this.changeLayersDisplay([this.markersLayer, this.lineSpansLayer], true);
    this.loadQueryParams();
    this.treeNavigationEvents();
    // this.getGeoJson();
    this.getGeoJsonV2();
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
        Leaflet.geoJSON(geojson, {
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
        Leaflet.geoJSON(geojson, {
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
    if (!this.map || !this.activeTileLayer) {
      return;
    }
    this.map.removeLayer(this.activeTileLayer.layer);
    this.activeTileLayer.isActive = false;
    this.map.addLayer(layerConfig.layer);
    layerConfig.isActive = true;
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
      this.markersLayer.getLayers().forEach((layer) => {
        (layer as CustomMarker).dragging?.enable();
      });
      this.isMarkersDraggable = true;
    } else {
      this.editElementsLayer.getLayers().forEach((layer) => {
        (layer as CustomMarker).dragging?.disable();
      });
      this.markersLayer.getLayers().forEach((layer) => {
        (layer as CustomMarker).dragging?.disable();
      });
      this.isMarkersDraggable = false;
    }
  }
  private addPoint(type: 'grndTower' | 'Tower' | 'Substation', coords: Leaflet.LatLng) {
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
              const latlng = new Leaflet.LatLng(res.lat, res.lng);
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
              const latlng = new Leaflet.LatLng(res.lat, res.lng);
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

              const latlng = new Leaflet.LatLng(res.lat, res.lng);

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
  private addElement(event: Leaflet.LeafletMouseEvent) {
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
              const latlng = new Leaflet.LatLng(res.lat, res.lng);
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
              const latlng = new Leaflet.LatLng(res.lat, res.lng);
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
              const latlng = new Leaflet.LatLng(res.lat, res.lng);
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
    // if (zoom <= 10 && Number(this.regionNode.getTooltip()?.getContent())) {
    //   const value = zoom * 20;
    //   const radius = value < 40 ? 40 : value;
    //   this.regionNode.setRadius(radius);
    //   this.regionNode.addTo(this.map);
    //   this.classList = [];
    //   this.changeLayersDisplay([this.markersLayer, this.lineSpansLayer], false);
    //   return;
    // }

    // this.regionNode.removeFrom(this.map);
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
  private changeLayersDisplay(layers: Leaflet.LayerGroup[], add: boolean) {
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
  private clearLayers(layers: Leaflet.LayerGroup[]) {
    layers.forEach((layer) => {
      layer.clearLayers();
    });
  }
  private loadQueryParams() {
    this.queryParamsService
      .getParams(['uid', 'panelState'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.passportsTreeService.selectedUID = params['uid'];
      });
  }
  private treeNavigationEvents() {
    this.passportsTreeService.navigateToNode$.pipe(takeUntil(this.destroy$)).subscribe((uid) => {
      if (!uid || !this.map) {
        return;
      }
      const panelState = null;

      this.router.navigate(['./'], {
        relativeTo: this.route,
        queryParams: { uid, panelState: panelState },
      });

      const markerLayer = this.markersLayer
        .getLayers()
        .find((layer) => (layer.options as CustomMarkerOptions)?.['uid'] === uid);

      if (markerLayer) {
        const bounds = (markerLayer.options as CustomMarkerOptions)['bounds'];
        this.map.setView({ lat: bounds.lat, lng: bounds.lng + 0.0025 }, 18);
        this.mapService.panelStateData = {
          name: (markerLayer as CustomMarker).props?.['name'] || '',
          type: (markerLayer as CustomMarker).props?.['type'] || '',
        };
        (markerLayer as CustomMarker).toggleTooltip();
        return;
      }

      const acLinesLayer = this.lineSpansLayer
        .getLayers()
        .find((layer) => (layer.options as LineOptions)?.['parentACLine'] === uid);
      if (acLinesLayer) {
        const bounds = (acLinesLayer.options as LineOptions)['bounds'];
        this.lineSpansLayer.getLayers().forEach((layer) => (layer as Line).setStyle({ color: 'darkblue' }));
        this.map.setView(bounds, 13);
        this.lineSpansLayer
          .getLayers()
          .filter((layer) => (layer.options as LineOptions)?.['parentACLine'] === uid)
          .forEach((layer) => (layer as Line).setStyle({ color: 'orange' }));
        return;
      }

      const lineSpansLayer = this.lineSpansLayer
        .getLayers()
        .find((layer) => (layer.options as LineOptions)?.['uid'] === uid);
      if (lineSpansLayer) {
        this.lineSpansLayer.getLayers().forEach((layer) => (layer as Line).setStyle({ color: 'darkblue' }));
        const bounds = (lineSpansLayer.options as LineOptions)['bounds'];
        this.map.setView(bounds, 18);
        (lineSpansLayer as Line).setStyle({ color: 'orange' });
        this.mapService.panelStateData = {
          name: (lineSpansLayer as Line).props?.['name'] || '',
          type: (lineSpansLayer as Line).props?.['type'] || '',
        };
        return;
      }
    });
  }
  private onEachFeature(feature: geojson.Feature, layer: Leaflet.Layer) {
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
            const bounds = new Leaflet.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
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
            const bounds = new Leaflet.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
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
            const latlngList: Leaflet.LatLngExpression[][] = feature.geometry.coordinates.map((position) => {
              const latlang: Leaflet.LatLngExpression[] = [];
              position.forEach((coord) => {
                latlang.push(new Leaflet.LatLng(coord[1], coord[0]));
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
                bounds: new Leaflet.LatLng(25, 25),
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
        .on('mouseover', (event: Leaflet.LeafletMouseEvent) => {
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
        .on('mouseout', (event: Leaflet.LeafletMouseEvent) => {
          const marker = event.target as CustomMarker;
          const parentUid = marker.options?.['parentLineSpan'];
          if (Array.isArray(parentUid)) {
            const lineSpansLayer = this.lineSpansLayer
              .getLayers()
              .filter((layer) => parentUid.includes((layer.options as LineOptions)?.['uid'] || ''));

            lineSpansLayer.forEach((layer) => (layer as Line).setStyle({ color: 'darkblue' }));
          }
        })
        .on('click', (event: Leaflet.LeafletMouseEvent) => this.ngZone.run(() => this.markerClick(event)))
        .on('dragend', (event: Leaflet.LeafletEvent) => this.ngZone.run(() => this.markerDrag(event)))
        .on('contextmenu', (event: Leaflet.LeafletMouseEvent) => this.contextMenu(event));
    } else {
      return new CustomMarker(data.position, data.options, data.props ?? undefined)
        .on('mouseover', (event: Leaflet.LeafletMouseEvent) => {
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
        .on('click', (event: Leaflet.LeafletMouseEvent) => this.ngZone.run(() => this.markerClick(event)))
        .on('dragend', (event: Leaflet.LeafletEvent) => this.ngZone.run(() => this.markerDrag(event)))
        .on('contextmenu', (event: Leaflet.LeafletMouseEvent) => this.contextMenu(event));
    }
  }
  private generateLine(data: LineData): Line {
    return new Line(data.position, data.options, data.props ?? undefined)
      .on('mouseover', (event: Leaflet.LeafletMouseEvent) => {
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
      .on('mouseout', (event: Leaflet.LeafletMouseEvent) => {
        const parentUid = (event.target as Line).options?.['parentACLine'];
        const lineSpansLayer = this.lineSpansLayer
          .getLayers()
          .filter((layer) => parentUid === (layer.options as LineOptions)?.['parentACLine']);
        lineSpansLayer.forEach((layer) => (layer as Line).setStyle({ color: 'darkblue' }));
      })
      .on('click', (event: Leaflet.LeafletMouseEvent) => this.ngZone.run(() => this.lineClick(event)))
      .on('contextmenu', (event: Leaflet.LeafletMouseEvent) => this.contextMenu(event));
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
  private markerDrag(event: Leaflet.LeafletEvent | CustomMarker, startLatLng: Leaflet.LatLng | null = null) {
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
        const lineCoords = el.getLatLngs() as Leaflet.LatLng[][];
        const coords = lineCoords[0].find((coords) => JSON.stringify(coords) === JSON.stringify(currentLatLng));
        return !!coords;
      })
      .forEach((line) => {
        const el = <Line>line;
        const lineCoords = el.getLatLngs() as Leaflet.LatLng[][];
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
  private lineClick(event: Leaflet.LeafletMouseEvent) {
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
          const lineSpanLayer = this.lineSpansLayer
            .getLayers()
            .find((layer) => (layer.options as LineOptions)?.['uid'] === event.target.options.uid);
          const editElementsLayer = this.editElementsLayer
            .getLayers()
            .find((layer) => (layer.options as LineOptions)?.['uid'] === event.target.options.uid);
          const lineSpanData: LineSpan = {
            uid: event.target.props?.['uid'],
            name: event.target.options.title || '',
            type: event.target.props?.['type'],
            pointsUidList: [],
          };
          if (lineSpanLayer) {
            event.target.removeFrom(this.lineSpansLayer);
            this.generateGeoDataDiffService.deleteElementDiff(lineSpanData);
          } else if (editElementsLayer) {
            event.target.removeFrom(this.editElementsLayer);
            this.generateGeoDataDiffService.deleteElementDiff(lineSpanData);
          }
        });
      return;
    }
  }
  private markerClick(event: Leaflet.LeafletMouseEvent) {
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
          const markerLayer = this.markersLayer
            .getLayers()
            .find((layer) => (layer.options as CustomMarkerOptions)?.['uid'] === event.target.options.uid);
          const editElementsLayer = this.editElementsLayer
            .getLayers()
            .find((layer) => (layer.options as CustomMarkerOptions)?.['uid'] === event.target.options.uid);
          const markerData: GeoPoint = {
            name: event.target.options.title || '',
            uid: event.target.props?.['uid'],
            type: event.target.props?.['type'],
            latLang: event.latlng,
            parentACLineSegment: event.target.props?.['parentACLineSegment'],
            isNew: false,
          };
          if (editElementsLayer) {
            event.target.removeFrom(this.editElementsLayer);
            this.generateGeoDataDiffService.deleteElementDiff(markerData);
          } else if (markerLayer) {
            event.target.removeFrom(this.markersLayer);
            this.generateGeoDataDiffService.deleteElementDiff(markerData);
          }
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
  private contextMenu(event: Leaflet.LeafletMouseEvent) {
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

    const popup = Leaflet.popup().setLatLng(event.latlng).setContent(container.outerHTML).openOn(this.map);
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
