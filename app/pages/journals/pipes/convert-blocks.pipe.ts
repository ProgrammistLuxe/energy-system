import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'convertBlocks',
  standalone: true,
})
export class ConvertBlocksPipe implements PipeTransform {
  transform(value: number | null | undefined): number | null | undefined {
    if (typeof value !== 'number') {
      return value;
    }
    value /= 2048;
    return value;
  }
}
