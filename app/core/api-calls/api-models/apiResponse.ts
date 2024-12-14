import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { ApiError } from './apiError';
/* Текст ошибки `${response}` или String(response)*/
/* Код ошибки +response или Number(response)*/
export class ApiResponseResolver<T> {
  result: T | null = null;
  error: ApiError | null = null;
}
export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export class ApiResponseSuccess<T> extends ApiResponseResolver<T> {
  override result: T;
  override error: null;
  constructor(data: ApiResponseSuccess<T>) {
    super();
    this.result = data.result;
    this.error = data.error;
  }
}
export class ApiResponseError extends ApiResponseResolver<null> {
  override result: null;
  override error: ApiError;
  [Symbol.toPrimitive](hint: string) {
    /* error code*/
    if (hint === 'number') {
      return this.error.errors ? this.error.errors[0].code : 1;
    }
    /* error message*/
    if (hint === 'string') {
      const message = this.error.errors ? getErrorsMessage(this.error) : 'Ошибка выполнения запроса';
      return message;
    }
    return null;
  }
  constructor(data: ApiResponseError) {
    super();
    this.result = data.result;
    this.error = data.error;
  }
}
