import { Pipe, PipeTransform } from '@angular/core';
import { Form, FormControl, FormGroup } from '@angular/forms';

@Pipe({
  name: 'getControl',
  standalone: true,
})
export class GetControlPipe implements PipeTransform {
  transform(value: string, form: FormGroup): FormControl | null {
    const control = <FormControl | null>form.controls[value];
    return control;
  }
}
