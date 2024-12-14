export interface Attribute {
  id: number;
  class_id: number;
  participant_id: number;
  type: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export interface GetAttributeListRes {
  data: Attribute[];
  count: number;
}
