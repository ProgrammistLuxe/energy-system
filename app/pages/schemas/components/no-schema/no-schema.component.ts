import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EmptyTemplateComponent, materialModules } from '@shared/index';

@Component({
  selector: 'app-no-schema',
  imports: [CommonModule, EmptyTemplateComponent, materialModules.matIconModule],
  templateUrl: './no-schema.component.html',
  styleUrl: './no-schema.component.scss',
})
export class NoSchemaComponent {}
