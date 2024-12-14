import { Component } from '@angular/core';
import { EmptyTemplateComponent } from '@shared/components';
import { materialModules } from '@shared/materials';

@Component({
  selector: 'app-no-integration',
  standalone: true,
  imports: [EmptyTemplateComponent, materialModules.matIconModule],
  templateUrl: './no-integration.component.html',
  styleUrl: './no-integration.component.scss',
})
export class NoIntegrationComponent {}
