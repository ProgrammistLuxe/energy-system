export interface ApiError {
  type: string;
  errors: ApiErrorDetails[];
}

export interface ApiErrorDetails {
  code: string;
  detail: string;
  attr: string;
}
