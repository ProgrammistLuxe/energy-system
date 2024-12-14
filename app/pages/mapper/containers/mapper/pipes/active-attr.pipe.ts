import { Pipe, PipeTransform } from '@angular/core';
import { ClassTypeAttr } from '@api-calls/services/http-class-type-service/models';
import { FilteredAttrs } from '../services/mapper.service';

@Pipe({
  name: 'activeAttr',
  standalone: true,
})
export class ActiveAttrPipe implements PipeTransform {
  transform(value: FilteredAttrs | null, attr: ClassTypeAttr): boolean {
    if (!value) {
      return false;
    }
    if (!value[attr.participant_id]) {
      return false;
    }
    return value[attr.participant_id].map((item) => item.id).includes(attr.id);
  }
}
