export interface PostDiffData {
  id: number;
  bucket_name: string;
  object_name: string;
  context: string;
  description?: string | null;
}
export interface PostDiffRes {
  data: PostDiffData[];
}
