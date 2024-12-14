export interface ClassTypeAttr {
  id: number;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  participant_id: number;
}
export interface GetClassTypeAttrRes {
  data: ClassTypeAttr[];
  count: number;
}
