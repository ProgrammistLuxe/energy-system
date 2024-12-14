import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { WorkAreaComponent } from '@shared/index';
import { IntegrationListComponent } from './containers/integration-list/integration-list.component';
import { RouterOutlet } from '@angular/router';
import { IntegrationService } from './services/integration.service';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, WorkAreaComponent, IntegrationListComponent, RouterOutlet],
  providers: [IntegrationService],
  templateUrl: './integrations.component.html',
  styleUrl: './integrations.component.scss',
})
export class IntegrationsComponent {
  constructor() {}
}
