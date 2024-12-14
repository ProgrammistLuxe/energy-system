import { AttributeLinkMultiplicity } from '@models';

export interface GetClassAskDataRes {
  type: string;
  names: ClassAskNames[];
  links: ClassAskAttributesLink[];
}
export interface ClassAskNames {
  predicate: string;
  label: string;
  value: any;
  description: string;
  type: string;
}
export interface ClassAskAttributesLink {
  predicate: string;
  label: string;
  class_name: string;
  description: string;
  multiplicity: AttributeLinkMultiplicity;
  library: boolean;
  data: ClassAskAttributesLinkData[];
}
export interface ClassAskAttributesLinkData {
  uid: string;
  value: string;
}
