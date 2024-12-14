export interface JSONRpcRequestObject {
  method: string;
  params: any;
  headers?: Record<string, any> | null | null;
}
