export interface GetRecordsListReq {
  limit: number;
  offset: number;
  date_from?: string | null;
  date_to?: string | null;
  timestamp_date_from?: string | null;
  timestamp_date_to?: string | null;
  source?: string | null;
  level?: string | null;
  journal_name?: string | null;
}
