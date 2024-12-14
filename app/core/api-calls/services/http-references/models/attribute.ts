export interface ReferencesAttribute {
  id: number;
  description: string;
  name: string;
  attributes_class: AttributeClass;
  type: string;
  explanation: string | null;
  attribute_prefix: number;
}
export interface AttributeClass {
  id: number;
  description: string;
  class_name: string;
  is_library: boolean;
}
