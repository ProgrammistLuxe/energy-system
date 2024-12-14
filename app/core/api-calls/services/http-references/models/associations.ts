export interface ReferencesAssociation {
  id: number;
  description: string;
  initial_class: InitialClass;
  final_class: FinalClass;
  name: string;
  multiplicity: string;
  explanation: string | null;
  association_prefix: number;
}
export interface FinalClass {
  id: number;
  description: string;
  class_name: string;
  is_library: boolean;
}
export interface InitialClass {
  id: number;
  description: string;
  class_name: string;
  is_library: boolean;
}
