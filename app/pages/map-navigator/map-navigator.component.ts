import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MapService } from './services/map.service';
import { MapComponent } from './containers/map/map.component';
import { AngularSplitModule } from 'angular-split';
import { PassportsTreeService } from '@features/passports-tree/services/passports-tree.service';
import { PassportsTreeComponent } from '@features/index';
import { GenerateGeoDataDiffService } from './services/generate-geo-data-diff.service';
import { MapV2Component } from './containers/map-v2/map-v2.component';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-map-navigator',
  imports: [CommonModule, MapComponent, MapV2Component, PassportsTreeComponent, AngularSplitModule],
  providers: [MapService, GenerateGeoDataDiffService],
  templateUrl: './map-navigator.component.html',
  styleUrl: './map-navigator.component.scss',
})
export class MapNavigatorComponent {
  mapVersion: number = 1;
  constructor(
    private passportsTreeService: PassportsTreeService,
    private route: ActivatedRoute,
  ) {}
  ngOnInit() {
    this.mapVersion = this.route.snapshot.url[0]?.path?.includes('map-v2') ? 2 : 1;
  }
  ngOnDestroy() {
    this.passportsTreeService.clearTreeState();
  }
}
