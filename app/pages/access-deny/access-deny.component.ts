import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EmptyTemplateComponent, materialModules } from '@shared/index';

@Component({
  selector: 'app-access-deny',
  imports: [
    CommonModule,
    EmptyTemplateComponent,
    RouterModule,
    materialModules.matIconModule,
    materialModules.matButtonModule,
  ],
  templateUrl: './access-deny.component.html',
})
export class AccessDenyComponent {}
