import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function noWhiteSpaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control?.value;
    if (typeof value !== 'string') {
      return null;
    }
    if (!value.length) {
      return null;
    }
    return !value.trim() ? { noWhiteSpace: true } : null;
  };
}
