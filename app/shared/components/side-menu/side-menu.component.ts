import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SideMenu, SideMenuChild } from '@models';
import { materialModules } from '@shared/index';

@Component({
  selector: 'app-side-menu',
  imports: [CommonModule, materialModules.matExpansionModule, materialModules.matIconModule, RouterModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss',
})
export class SideMenuComponent {
  @Input() menuItems: SideMenu[] = [];
  get panelMaxHeight(): string {
    const value = (this.menuItems.length - 1) * 52;
    return `calc(100% - ${value}px)`;
  }
  getPanelHeight(length: number): string {
    const value = length * 48 + 48 + 20;
    return `${value}px`;
  }
  checkActiveState(index: number, item: SideMenuChild, isActive: boolean) {
    item.isActive = isActive;
    this.menuItems[index].isActive = this.menuItems[index].children.some((child) => child.isActive);
  }
  toggleItemActiveState(item: SideMenu, isActive: boolean) {
    item.isActive = isActive;
  }
}
