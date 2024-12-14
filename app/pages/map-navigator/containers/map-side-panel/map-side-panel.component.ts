import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { PassportsTreeService } from '@features/passports-tree/services/passports-tree.service';
import { MapService } from '../../services/map.service';
import { EmptyTemplateComponent, MatIconButtonCustomDirective, materialModules } from '@shared/index';
import { PanelState } from '@pages/map-navigator/containers/map/models';
import { PassportViewComponent } from './containers/passport-view/passport-view.component';
import { SchemaComponent } from './containers/schema/schema.component';
import { SchemaPngComponent } from './containers/schema-png/schema-png.component';
import { MatDrawer } from '@angular/material/sidenav';
import { ReplaySubject, filter, takeUntil } from 'rxjs';
import { MatChipSelectionChange } from '@angular/material/chips';

@Component({
  selector: 'app-map-side-panel',
  imports: [
    CommonModule,
    materialModules.matSidePanelModule,
    materialModules.matIconModule,
    materialModules.matButtonModule,
    materialModules.matTooltipModule,
    materialModules.matChipsModule,
    EmptyTemplateComponent,
    PassportViewComponent,
    SchemaComponent,
    SchemaPngComponent,
    MatIconButtonCustomDirective,
  ],
  templateUrl: './map-side-panel.component.html',
  styleUrl: './map-side-panel.component.scss',
})
export class MapSidePanelComponent {
  @ViewChild('drawer') drawer: MatDrawer | null = null;
  @Output() panelStateChanged: EventEmitter<void> = new EventEmitter<void>();
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private passportsTreeService: PassportsTreeService,
    private mapService: MapService,
  ) {}
  get treeExpanding() {
    return this.passportsTreeService.treeExpanding;
  }
  get selectedUid(): string | null {
    return this.passportsTreeService.selectedUID;
  }
  get panelState(): PanelState {
    return this.mapService.panelState;
  }
  setChipSelection(event: MatChipSelectionChange) {
    if (!event.selected || !event.source.value) {
      return;
    }
    this.mapService.panelState = event.source.value;
    this.panelStateChanged.emit();
  }
  ngOnInit() {
    this.mapService.panelState$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      if (!this.drawer) {
        return;
      }
      if (!state) {
        this.drawer.close();
        return;
      }
      this.drawer.open();
    });
  }
  ngAfterViewInit() {
    this.drawer?._openedStream.subscribe(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
