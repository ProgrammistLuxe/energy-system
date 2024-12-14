export interface Participant {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export interface GetParticipantRes {
  data: Participant[];
  count: number;
}
