import { Component } from '@angular/core';
import { EmptyTemplateComponent, materialModules } from '@shared/index';

@Component({
  selector: 'app-no-class',
  imports: [EmptyTemplateComponent, materialModules.matIconModule],
  templateUrl: './no-template.component.html',
  styleUrl: './no-template.component.scss',
})
export class NoTemplateComponent {}
