import { Injectable } from '@angular/core';
import { ApiService } from '@api-calls/api/api.service';

@Injectable({
  providedIn: 'root',
})
export class HttpMinioService {
  constructor(private apiService: ApiService) {}
  getFromMinioByUrl(url: string) {
    return this.apiService.getFromMinioByUrl<Blob>(url);
  }
  getFromMinio(bucket: string, name: string) {
    return this.apiService.getFromMinio<string>(bucket, name);
  }
  saveToMinio(bucket: string, fileName: string, formData: FormData) {
    return this.apiService.saveToMinioRequest(bucket, fileName, formData);
  }
}
