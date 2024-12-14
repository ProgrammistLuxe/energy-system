export interface Integration {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export interface GetIntegrationRes {
  data: Integration[];
  count: number;
}
