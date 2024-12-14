export interface GetPassportFilesReq {
  uid: string;
  class_name: string;
  format: 'xlsx' | 'pdf';
}
