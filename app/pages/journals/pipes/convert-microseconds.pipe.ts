import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'convertMicroseconds',
  standalone: true,
})
export class ConvertMicrosecondsPipe implements PipeTransform {
  transform(value: number | null | undefined): number | null | undefined {
    if (typeof value !== 'number') {
      return value;
    }
    value /= 1000000;
    return value;
  }
}
