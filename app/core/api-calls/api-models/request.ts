import { HttpHeaderResponse, HttpHeaders } from '@angular/common/http';
import { JSONRpcRequestObject } from './requestObject';

export type RequestData =
  | {
      [key: string]: string | number | boolean | any | null;
    }
  | undefined
  | any[];

export class JSONRpcRequest {
  method: string;
  data: RequestData;
  headers?: Record<string, any> | null;

  constructor(method: string, data?: RequestData, headers?: Record<string, any> | null) {
    this.method = method;
    this.data = data;
    this.headers = headers;
  }

  path(): string {
    if (!this.method) {
      throw new Error('controller/method data is missing');
    }

    return `/${this.method}`;
  }

  requestObject(): JSONRpcRequestObject {
    return {
      method: `${this.method}`,
      params: this.data,
    };
  }
}
