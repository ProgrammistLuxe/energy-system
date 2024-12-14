export interface ReferencesClass {
  id: number;
  description: string;
  class_name: string;
  parent: ReferencesClassParent | null;
  explanation: string | null;
  is_library: boolean;
  prefix: number;
}

interface ReferencesClassParent {
  id: number;
  description: string;
  class_name: string;
  explanation: string;
  is_library: false;
}
