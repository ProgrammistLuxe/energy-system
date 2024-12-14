import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'default',
  standalone: true,
})
export class DefaultPipe implements PipeTransform {
  transform(value: string | number | null | undefined, defaultValue: string = '- -'): string | number {
    if (typeof value === 'number') {
      return isNaN(value) ? defaultValue : value;
    }
    return value || defaultValue;
  }
}
