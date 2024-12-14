export interface EditAssociation {
  id: number;
  description: string;
  initial_class: number;
  final_class: number;
  name: string;
  multiplicity: string;
  explanation: string | null;
  association_prefix: number;
}
