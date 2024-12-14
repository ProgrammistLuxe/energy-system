import { Component } from '@angular/core';
import { ActionMenuComponent } from './components/table/action-menu/action-menu.component';
import { EmployeesTableComponent } from './components/table/table.component';

@Component({
  selector: 'app-employees',
  imports: [ActionMenuComponent, EmployeesTableComponent],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
})
export class EmployeesComponent {}
