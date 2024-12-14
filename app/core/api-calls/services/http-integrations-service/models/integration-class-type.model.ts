export interface IntegrationClassType {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
export interface GetIntegrationClassTypeRes {
  data: IntegrationClassType[];
  count: number;
}
