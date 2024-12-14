import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EmptyTemplateComponent, materialModules } from '@shared/index';

@Component({
  selector: 'app-no-template',
  imports: [CommonModule, materialModules.matIconModule, EmptyTemplateComponent],
  templateUrl: './no-template.component.html',
  styleUrl: './no-template.component.scss',
})
export class NoTemplateComponent {}
