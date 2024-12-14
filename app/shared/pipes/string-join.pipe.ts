import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'stringJoin', standalone: true })
export class StringJoinPipe implements PipeTransform {
  transform(value: string[], delimiter: string = '\r\n'): string {
    return value.map((item) => item.trim()).join(delimiter);
  }
}
