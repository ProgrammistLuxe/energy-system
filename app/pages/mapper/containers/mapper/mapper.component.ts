import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { WorkAreaComponent } from '@shared/index';
import { MapperIntegrationListComponent } from './containers/mapper-integration-list/mapper-integration-list.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-mapper',
  standalone: true,
  imports: [CommonModule, WorkAreaComponent, MapperIntegrationListComponent, RouterOutlet],
  templateUrl: './mapper.component.html',
  styleUrl: './mapper.component.scss',
})
export class MapperComponent {}
