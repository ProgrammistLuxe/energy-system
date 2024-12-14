export interface UpdateClassTypeReq {
  class_type_id: number;
  integration_id: number;
  name: string;
  description?: string | undefined | null;
}
