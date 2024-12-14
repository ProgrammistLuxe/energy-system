import { GetDiffRes } from '.';

export interface GetDiffListRes {
  total: number;
  page: number;
  size: number;
  pages: number;
  items: GetDiffRes[];
}
