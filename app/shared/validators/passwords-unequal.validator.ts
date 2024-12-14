import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export function PasswordsUnequalValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) {
      return null;
    }
    const formGroup = control.parent as FormGroup;
    const password = formGroup.get('current_password')?.value;
    const password_repeat = formGroup.get('new_password')?.value;
    if (password && password_repeat) {
      return password !== password_repeat ? null : { passwordNotUnequal: true };
    }
    return null;
  };
}
