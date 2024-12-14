import { Pipe, PipeTransform } from '@angular/core';
import { getCroppedName } from '@core/utils/cut-prefix';

@Pipe({
  name: 'cutPrefix',
  standalone: true,
})
export class CutPrefixPipe implements PipeTransform {
  transform(value: string): string {
    return getCroppedName(value);
  }
}
