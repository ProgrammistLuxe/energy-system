export interface CreateClass {
  description: string;
  class_name: string;
  parent: number | null;
  class_prefix: number;
  explanation: string | null;
  is_library: boolean;
}
