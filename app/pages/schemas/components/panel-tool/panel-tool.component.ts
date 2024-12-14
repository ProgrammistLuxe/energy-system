import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { materialModules } from '@shared/index';

export interface Element {
  id: number;
  type: string;
  name: string;
  icon: string;
}
@Component({
  selector: 'app-panel-tool',
  imports: [CommonModule, materialModules.matButtonModule],
  templateUrl: './panel-tool.component.html',
  styleUrl: './panel-tool.component.scss',
})
export class PanelToolComponent {
  @Output() selectedElementChanged: EventEmitter<Element | null> = new EventEmitter<Element | null>();
  selectedElement: Element | null = null;
  elements: Element[] = [
    {
      id: 1,
      type: 'VoltageLevel',
      name: 'ТН с одной вторичной обмоткой',
      icon: 'VoltageLevel.png',
    },
    {
      id: 2,
      type: 'Substation',
      name: 'Подстанция',
      icon: 'Substation.png',
    },
    {
      id: 3,
      type: 'Terminal',
      name: 'Полюс',
      icon: 'Terminal.png',
    },
  ];
  selectElement(element: Element) {
    this.selectedElement = element;
    this.selectedElementChanged.emit(element);
  }
  resetSelectedElement() {
    this.selectedElement = null;
    this.selectedElementChanged.emit(null);
  }
}
