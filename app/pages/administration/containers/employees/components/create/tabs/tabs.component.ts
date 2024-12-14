import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { materialModules } from '@shared/index';
import { UserDataService } from '../../services/user.service';

@Component({
  selector: 'app-create-employee-tabs',
  imports: [CommonModule, materialModules.matTabsModule, materialModules.matBadgeModule, RouterModule],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class CreateEmployeeTabsComponent {
  user$ = this.userDataService.user$;

  constructor(private userDataService: UserDataService) {}

  ngOnInit() {
    this.userDataService.user = null;
  }
}
