import { GetUserGroup } from '@api-calls/services/http-role-group-service/models/get-user-group';

export interface UserMe {
  id: number;
  is_active: boolean;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  username: string;
  phone: string | null;
  appointment: string | null;
  job_title: string | null;
  groups: GetUserGroup[];
  permissions: string[];
}
