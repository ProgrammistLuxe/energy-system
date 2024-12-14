import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '@shared/components';
import { materialModules } from '@shared/index';
import { CreateActionMenuComponent } from './action-menu/action-menu.component';

@Component({
  selector: 'app-create-employee',
  imports: [CreateActionMenuComponent, RouterModule, FooterComponent, materialModules.matButtonModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
})
export class CreateEmployeeComponent {}
