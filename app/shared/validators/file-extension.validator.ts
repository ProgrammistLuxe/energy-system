import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function fileExtensionValidator(extensions: string[]): ValidatorFn {
  return (control: AbstractControl<FileList | null>): ValidationErrors | null => {
    const value = control?.value;
    if (!value) {
      return null;
    }
    if (!value?.length) {
      return null;
    }
    let isInvalid = false;

    for (let i = 0; i < value.length; i++) {
      const extension = value[i].name.split('.')[1];
      if (!extensions.includes(extension)) {
        isInvalid = true;
        break;
      }
    }
    return isInvalid ? { fileExtension: true } : null;
  };
}
