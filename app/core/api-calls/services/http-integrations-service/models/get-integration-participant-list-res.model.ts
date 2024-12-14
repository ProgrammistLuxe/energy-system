export interface IntegrationParticipant {
  id: number;
  name: string;
  addedAt: string;
}
export interface GetIntegrationParticipantListRes {
  data: IntegrationParticipant[];
  count: number;
}
