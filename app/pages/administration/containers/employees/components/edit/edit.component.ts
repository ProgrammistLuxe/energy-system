import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '@shared/components';
import { materialModules } from '@shared/index';
import { EditActionMenuComponent } from './action-menu/action-menu.component';

@Component({
  selector: 'app-employee-create-edit',
  imports: [EditActionMenuComponent, RouterModule, FooterComponent, materialModules.matButtonModule],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss',
})
export class EditEmployeeComponent {}
