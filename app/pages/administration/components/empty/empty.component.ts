import { Component } from '@angular/core';
import { EmptyTemplateComponent, materialModules } from '@shared/index';

@Component({
  selector: 'app-empty',
  imports: [EmptyTemplateComponent, materialModules.matIconModule],
  templateUrl: './empty.component.html',
  styleUrl: './empty.component.scss',
})
export class EmptyComponent {}
