import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getColumnName',
  standalone: true,
})
export class GetColumnNamePipe implements PipeTransform {
  transform(value: string, parent: string): string {
    const splittedValue = value.split(parent);
    if (!splittedValue.length) {
      return '';
    }
    return splittedValue[1];
  }
}
