import { ApiError } from '@api-calls/api-models';

export function getErrorsMessage(error: ApiError): string | null {
  if (!error.errors?.length) {
    return null;
  }
  return error.errors.map((err) => err.detail).join(', ');
}
