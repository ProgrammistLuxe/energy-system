import { Component } from '@angular/core';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { RouterModule } from '@angular/router';
import { materialModules } from '@shared/materials';
import { ActiveDiffsTableComponent } from '@features/index';

@Component({
  selector: 'app-layout',
  imports: [NavBarComponent, RouterModule, materialModules.matIconModule, ActiveDiffsTableComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {}
