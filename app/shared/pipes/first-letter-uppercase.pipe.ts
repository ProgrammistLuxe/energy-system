import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'firstLetterUppercase',
  standalone: true,
})
export class FirstLetterUppercasePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value
      .split('')
      .map((item, index) => (index ? item : item.toUpperCase()))
      .join('');
  }
}
