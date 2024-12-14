export interface EditClass {
  id: number;
  description: string;
  class_name: string;
  parent: number | null;
  explanation: string | null;
  is_library: boolean;
  class_prefix: number;
}
