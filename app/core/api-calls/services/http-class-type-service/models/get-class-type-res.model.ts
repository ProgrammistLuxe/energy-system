import { Integration } from '@api-calls/services/http-integrations-service/models';

export interface ClassType {
  id: number;
  integration: Integration;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
export interface GetClassTypeRes {
  data: ClassType[];
  count: number;
}
