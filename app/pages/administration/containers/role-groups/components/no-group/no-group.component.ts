import { Component } from '@angular/core';
import { EmptyTemplateComponent, materialModules } from '@shared/index';

@Component({
  selector: 'app-no-group',
  imports: [EmptyTemplateComponent, materialModules.matIconModule],
  templateUrl: './no-group.component.html',
  styleUrl: './no-group.component.scss',
})
export class NoGroupComponent {}
