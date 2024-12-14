export interface GetRecordsListRes {
  totalSize: number;
  logs: GetRecordRes[];
}
export interface GetRecordRes {
  journal_name: string;
  level: string;
  log: string;
  source: string;
  extra: string;
  timestamp: string;
  added_utc: string;
  point: string;
}
export type RecordStatus = 'info' | 'warning' | 'error';
