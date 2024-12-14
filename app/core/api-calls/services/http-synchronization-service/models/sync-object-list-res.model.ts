export interface GetSyncObjectListRes {
  count: number;
  data: SyncObject[];
}
export interface SyncObjectAttr {
  name: string;
  type: string;
  value: string;
}
export interface SyncObject {
  synchronization_id: number;
  participants: {
    participant_id: number;
    attributes: SyncObjectAttr[];
  }[];
}
