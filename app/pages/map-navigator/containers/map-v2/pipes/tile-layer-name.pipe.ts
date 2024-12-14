import { Pipe, PipeTransform } from '@angular/core';
import { TileLayer } from '../map-v2.component';

@Pipe({ name: 'tileLayerName', standalone: true })
export class TileLayerName implements PipeTransform {
  transform(value: TileLayer): string {
    switch (value) {
      case 'substation': {
        return 'Подстанции';
      }
      case 'linespan': {
        return 'Пролеты';
      }
      case 'tower': {
        return 'Опоры';
      }
    }
  }
}
