import { FormGroup } from '@angular/forms';
import { ApiError } from '@api-calls/api-models';

export function mapBackendErrors(serverErrors: ApiError, form: FormGroup) {
  switch (serverErrors.type) {
    case 'validation_error': {
      const backendFormErrors = serverErrors.errors;
      backendFormErrors.forEach((error) => {
        form.get(error.attr)?.setErrors({
          server: error.detail,
        });
      });
      break;
    }
  }
}
