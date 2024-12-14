import { AttributeLinkMultiplicity } from '@models';

export interface GetAttributesData {
  uid: string;
  type: string;
  names: Names[];
  links: AttributesLink[];
}
export interface Names {
  predicate: string;
  description: string;
  label: string;
  value: any;
  type: string;
}
export interface AttributesLink {
  predicate: string;
  label: string;
  description: string;
  class_name: string;
  multiplicity: AttributeLinkMultiplicity;
  library: boolean;
  data: AttributesLinkData[];
}
export interface AttributesLinkData {
  uid: string;
  value: string;
}
