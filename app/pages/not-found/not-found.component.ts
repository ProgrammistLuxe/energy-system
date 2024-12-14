import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EmptyTemplateComponent, materialModules } from '@shared/index';

@Component({
  selector: 'app-not-found',
  imports: [
    CommonModule,
    EmptyTemplateComponent,
    RouterModule,
    materialModules.matIconModule,
    materialModules.matButtonModule,
  ],
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {}
