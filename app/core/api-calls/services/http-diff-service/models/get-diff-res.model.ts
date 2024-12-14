export interface GetDiffRes {
  id: number;
  bucket_name: string;
  object_name: string;
  context: string;
  description: string;
  error_raw?: string | null;
  status: DiffStatus;
  size: number | null;
  timedelta: number | null;
  mem_size: number | null;
  mem_peak: number | null;
  date_created: string;
  date_updated: string;
}
export type DiffStatus = 'applied' | 'waiting' | 'error';
