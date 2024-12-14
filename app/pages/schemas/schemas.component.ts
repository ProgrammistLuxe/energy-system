import { Component } from '@angular/core';
import { WorkAreaComponent, WorkAreaSidePanelComponent } from '@shared/index';
import { JsonLdConverterService } from './services/jsonLdConverter.service';
import { ChangeQueueService } from './services/change-queue';
import { RouterOutlet } from '@angular/router';
import { SchemasListComponent } from './containers/schemas-list/schemas-list.component';

@Component({
  selector: 'app-schemas',
  imports: [WorkAreaSidePanelComponent, WorkAreaComponent, SchemasListComponent, RouterOutlet],
  providers: [JsonLdConverterService, ChangeQueueService],
  templateUrl: './schemas.component.html',
  styleUrl: './schemas.component.scss',
})
export class SchemasComponent {}
