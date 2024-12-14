import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'convertBytes',
  standalone: true,
})
export class ConvertBytesPipe implements PipeTransform {
  transform(value: number | null | undefined): number | null | undefined {
    if (typeof value !== 'number') {
      return value;
    }
    value /= 1000;
    return value;
  }
}
