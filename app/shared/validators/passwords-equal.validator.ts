import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export function PasswordsEqualValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) {
      return null;
    }
    const formGroup = control.parent as FormGroup;
    const password = formGroup.get('password')?.value;
    const password_repeat = formGroup.get('password_repeat')?.value;
    if (password && password_repeat) {
      return password === password_repeat ? null : { passwordNotEqual: true };
    }
    return null;
  };
}
