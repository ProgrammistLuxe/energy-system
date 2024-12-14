import { Pipe, PipeTransform } from '@angular/core';
import { DiffStatus } from '@api-calls/services/http-diff-service/models';
import { RecordStatus } from '@api-calls/services/http-synchronization-journal-service/models';

@Pipe({
  name: 'translateStatus',
  standalone: true,
})
export class TranslateStatusPipe implements PipeTransform {
  transform(value: DiffStatus | RecordStatus): string {
    switch (value) {
      case 'applied': {
        return 'Успешно';
      }
      case 'error': {
        return 'Ошибка';
      }
      case 'waiting': {
        return 'Обрабатывается';
      }
      case 'warning': {
        return 'Предупрежденение';
      }
      case 'info': {
        return 'Информация';
      }
      default: {
        return 'Информация';
      }
    }
  }
}
