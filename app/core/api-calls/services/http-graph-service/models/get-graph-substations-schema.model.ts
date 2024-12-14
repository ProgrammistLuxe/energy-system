export interface GetGraphSubstationsSchema {
  nodes: SubstationData[];
  edges: string[][];
}
export interface SubstationData {
  uid: string;
  name: string;
  type: string;
}
