export interface GetPassportData {
  data: {
    Title: PassportTitle[];
    Table: Record<string, PassportData>;
  };
}
export interface PassportTitle {
  title: string;
  value: { name: string; value: string | null }[];
}
export interface PassportData {
  name: string;
  columns: string[];
  value: Array<Array<{ value: any; info: string } | null>>;
}
