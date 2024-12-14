export interface GetGraphClassSearchRes {
  total: number;
  page: number;
  size: number;
  pages: number;
  data: GetGraphClassSearchDataItem[];
}
export interface GetGraphClassSearchDataItem {
  uid: string;
  name: string | null;
}
