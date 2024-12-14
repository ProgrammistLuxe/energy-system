import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MapAction } from '../../models';
import { materialModules } from '@shared/materials';

@Component({
  selector: 'app-map-edit-action',
  imports: [
    CommonModule,
    materialModules.matFormFieldModule,
    materialModules.matSelectModule,
    materialModules.matOptionModule,
  ],
  templateUrl: './map-edit-action.component.html',
  styleUrl: './map-edit-action.component.scss',
})
export class MapEditActionComponent {
  @Output() actionChanged: EventEmitter<MapAction> = new EventEmitter<MapAction>();
  optionsList: { name: string; value: MapAction }[] = [
    {
      name: 'Добавить точку поворота кабеля',
      value: 'grndTower',
    },
    {
      name: 'Добавить воздушную опору',
      value: 'Tower',
    },
    {
      name: 'Добавить подстанцию',
      value: 'Substation',
    },
    {
      name: 'Добавить пролет',
      value: 'LineSpan',
    },
    {
      name: 'Добавить сегмент',
      value: 'ACLineSegment',
    },
    {
      name: 'Перетаскивание',
      value: 'drag',
    },
    {
      name: 'Удаление',
      value: 'delete',
    },
  ];
}
