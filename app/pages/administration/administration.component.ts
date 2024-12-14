import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideMenu } from '@models';
import { SideMenuComponent, WorkAreaComponent } from '@shared/components';

@Component({
  selector: 'app-administration',
  imports: [CommonModule, WorkAreaComponent, SideMenuComponent, RouterOutlet],
  templateUrl: './administration.component.html',
  styleUrl: './administration.component.scss',
})
export class AdministrationComponent {
  administrationMenu: SideMenu[] = [
    {
      name: 'Персонал',
      icon: 'person',
      children: [
        { name: 'Карточки сотрудников', routerLink: 'employees' },
        { name: 'Группы прав', routerLink: 'role-groups' },
      ],
    },
  ];
}
